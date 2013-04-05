package widgetsandbox.databrokers;

import java.io.IOException;
import java.io.InputStream;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;

import widgetsandbox.databrokers.examples.ExampleDefinition;
import widgetsandbox.databrokers.examples.ExampleSet;

import com.aviarc.core.InterfaceQuery;
import com.aviarc.core.UnsupportedInterfaceException;
import com.aviarc.core.components.AviarcURN;
import com.aviarc.core.components.AviarcURN.Type;
import com.aviarc.core.components.NoSuchComponentException;
import com.aviarc.core.databroker.DataBroker;
import com.aviarc.core.databroker.DataBrokerException;
import com.aviarc.core.dataset.Dataset;
import com.aviarc.core.dataset.DatasetRow;
import com.aviarc.core.resource.ResourceDirectory;
import com.aviarc.core.resource.ResourceDirectoryProvider;
import com.aviarc.core.resource.ResourceFile;
import com.aviarc.framework.diagnostics.ResourceCompilationResult;

public class WidgetNamespaceExamplesDataBrokerImpl implements DataBroker {

    public void callOperation(CallOperationContext callOperationContext) throws DataBrokerException {
        // Execute the operation specified by the given context
        // Default implementation does nothing.
    }

    public void onDatasetBound(Dataset dataset, DatasetBindingContext context) throws DataBrokerException {
        // The broker can use this operation to set up entity mappings or to bind data rules to the Dataset.
    }

    public String getDataSourceName() {
        // If your broker uses a named datasource, return the name here. 
        return null;
    }

    public void populateDataset(Dataset dataset, PopulateDatasetContext context) throws DataBrokerException {
        if (!"get-widget-namespace-examples".equals(context.getOperationName())) {
            throw new DataBrokerException("Invalid operation name");
        }
        String urn = context.getParameters().get("urn");
       
        Object component;
        try {
            AviarcURN widgetURN = AviarcURN.valueOf(urn);
            
            //change it to a namespace
            AviarcURN nsURN = widgetURN.builder().type(Type.WIDGET_SET).build();
            
            component = context.getCurrentState().getAviarc().getComponentLocator().getComponent(nsURN);
            ResourceDirectoryProvider dirProvider = InterfaceQuery.queryInterface(component, ResourceDirectoryProvider.class);
            
            ResourceDirectory dir = dirProvider.getResourceDirectory();
            
            ResourceFile file = dir.getFile("examples.xml");
            
            dataset.deleteAllRows();
            
            if (!file.exists()) {
                return;
            }
            
            InputStream examples = file.getInputStream();
            try {
                XMLInputFactory inputFactory = XMLInputFactory.newInstance();
                inputFactory.setProperty(XMLInputFactory.IS_COALESCING, true);
                XMLStreamReader reader = inputFactory.createXMLStreamReader(examples);
                Utils.nextElement(reader);
                ResourceCompilationResult<ExampleSet> result = ExampleSet.makeFrom(reader);
                if (result.getResourceCompilationInfo().hasErrors()) {
                    throw new DataBrokerException("Errors in examples file " + result.getResourceCompilationInfo().toString());
                }
                
                ExampleSet set = result.getResult();
                
                dataset.deleteAllRows();
                
                for (ExampleDefinition exampleDef : set.getAllExampleDefinitions()) {
                    DatasetRow row = dataset.createRow();
                    row.setField("title", exampleDef.getTitle());                
                    row.setField("description", exampleDef.getDescription());
                    row.setField("xml", exampleDef.getXML());
                }
                
            } catch (XMLStreamException e) {
                throw new DataBrokerException(e);
            } finally {
                try {
                    examples.close();
                } catch (IOException ignored) {}
            }
                                
            
            
        } catch (NoSuchComponentException e) {
            throw new DataBrokerException("No such namespace with urn: " + urn);
        } catch (UnsupportedInterfaceException e) {
            throw new DataBrokerException("Component cannot provide us a resource directory: " + urn);
        }
        
        
        
        
    }

    public void storeDatasetChanges(Dataset dataset, StoreDatasetChangesContext storeDatasetChangesContext) throws DataBrokerException {
        // Persist the changes to the given dataset.
        // Default implementation makes no changes.
    }

}
