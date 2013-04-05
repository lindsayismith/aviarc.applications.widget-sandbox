package widgetsandbox.databrokers;

import com.aviarc.core.application.Application;
import com.aviarc.core.components.AviarcURN;
import com.aviarc.core.databroker.DataBroker;
import com.aviarc.core.databroker.DataBrokerException;
import com.aviarc.core.dataset.Dataset;
import com.aviarc.core.dataset.DatasetRow;

public class WidgetNamespacesDataBrokerImpl implements DataBroker {

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
        if (!"get-all-widget-namespaces".equals(context.getOperationName())) {
            throw new DataBrokerException("Invalid operation name");
        }
        
        // Get all the namespaces from the application and the engine
        dataset.deleteAllRows();
        
        Application app = context.getCurrentState().getCurrentApplication();
        for (AviarcURN urn : app.getWidgetManager().getAllURNs()) {
            DatasetRow row = dataset.createRow();
            row.setField("urn", urn.toString());
            row.setField("location", "application");
        }
        
        for (AviarcURN urn : context.getCurrentState().getAviarc().getEngineWidgetManager().getAllURNs()) {
            DatasetRow row = dataset.createRow();
            row.setField("urn", urn.toString());
            row.setField("location", "shared");
        }
        
    }

    public void storeDatasetChanges(Dataset dataset, StoreDatasetChangesContext storeDatasetChangesContext) throws DataBrokerException {
        // Persist the changes to the given dataset.
        // Default implementation makes no changes.
    }

}
