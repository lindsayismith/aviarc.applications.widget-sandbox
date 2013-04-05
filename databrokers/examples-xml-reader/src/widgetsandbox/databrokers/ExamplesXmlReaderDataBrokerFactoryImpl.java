package widgetsandbox.databrokers;

import com.aviarc.core.Aviarc;
import com.aviarc.core.application.Application;
import com.aviarc.core.databroker.DataBrokerCreationRecord;
import com.aviarc.core.databroker.DataBrokerFactory;
import com.aviarc.core.diagnostics.ResourceCompilationInfo;
import com.aviarc.core.diagnostics.SimpleResourceDiagnostic;
import com.aviarc.core.diagnostics.ResourceDiagnostic.ResourceType;
import com.aviarc.core.resource.ResourceDirectory;
import com.aviarc.framework.databroker.DataBrokerCreationRecordImpl;

public class ExamplesXmlReaderDataBrokerFactoryImpl implements DataBrokerFactory {

    public DataBrokerCreationRecord createDataBroker(ResourceDirectory resourceDir, ClassLoader commandClassLoader) {
        // Create your broker instance here for the given resourceDir and ClassLoader
        // Return a creation record for that broker.  Useful classes are 
        //   com.aviarc.framework.databroker.DataBrokerCreationRecordImpl for successfully created brokers
        //   com.aviarc.framework.databroker.BrokenDataBrokerCreationRecordImpl if the broker has errors
        
        // The default implementation instantiates the broker implementation, but adds a warning that the broker
        // is not implemented
        ExamplesXmlReaderDataBrokerImpl broker = new ExamplesXmlReaderDataBrokerImpl(resourceDir);
        
        ResourceCompilationInfo compilationInfo = new ResourceCompilationInfo();
        compilationInfo.add(new SimpleResourceDiagnostic(ResourceType.DATABROKER, resourceDir.getName(), null, "The broker is not yet implemented", false));
        
        return new DataBrokerCreationRecordImpl(resourceDir.getName(), broker, resourceDir, compilationInfo);
    }

    public void initialize(Aviarc aviarc, Application app) {
        // Perform any initialization, or store references to Aviarc or the current Application if required
    }
    
}
