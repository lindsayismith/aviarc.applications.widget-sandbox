package widgetsandbox.databrokers;

import java.io.IOException;
import java.io.InputStream;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;

import widgetsandbox.databrokers.examples.ExampleDefinition;
import widgetsandbox.databrokers.examples.ExampleSet;

import com.aviarc.core.databroker.DataBroker;
import com.aviarc.core.databroker.DataBrokerException;
import com.aviarc.core.dataset.Dataset;
import com.aviarc.core.dataset.DatasetRow;
import com.aviarc.core.resource.ResourceDirectory;
import com.aviarc.core.resource.ResourceFile;
import com.aviarc.framework.diagnostics.ResourceCompilationResult;

public class ExamplesXmlReaderDataBrokerImpl implements DataBroker {

    private ResourceDirectory _resourceDir;

    public ExamplesXmlReaderDataBrokerImpl(ResourceDirectory resourceDir) {
        _resourceDir = resourceDir;       
    }

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
        if (!"get-all".equals(context.getOperationName())) {
             throw new DataBrokerException("Unrecognized operation '" + context.getOperationName());           
        } 
        ResourceFile file = _resourceDir.getFile("examples.xml");
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
    }

    public void storeDatasetChanges(Dataset dataset, StoreDatasetChangesContext storeDatasetChangesContext) throws DataBrokerException {
        // Persist the changes to the given dataset.
        // Default implementation makes no changes.
    }

    
    
}
