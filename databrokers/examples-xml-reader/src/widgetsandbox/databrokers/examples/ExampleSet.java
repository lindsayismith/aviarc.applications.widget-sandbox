package widgetsandbox.databrokers.examples;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;

import widgetsandbox.databrokers.Utils;
import widgetsandbox.databrokers.Utils.ResourceCompilationElementHandler;

import com.aviarc.framework.diagnostics.ResourceCompilationResult;

public class ExampleSet {
    private static class LocalElementHandler extends ResourceCompilationElementHandler {
        private ExampleSet _result;

        public LocalElementHandler() {
            super();
            _result = new ExampleSet();
        }
        
        public void handleElement(XMLStreamReader reader) throws XMLStreamException {
            if (reader.getLocalName().equals("example")) {
                ExampleDefinition definition = ExampleDefinition.makeFrom(reader).addToAndIgnoreErrors(this.getResourceCompilationInfo());
                _result._examples.add(definition);                
            }            
        }
        
        public ResourceCompilationResult<ExampleSet> getResult() {
            return new ResourceCompilationResult<ExampleSet>(_result, this.getResourceCompilationInfo());
        }

    }

    private List<ExampleDefinition> _examples = new ArrayList<ExampleDefinition>();
    
    public ExampleSet() {
        
    }
    
    public static ResourceCompilationResult<ExampleSet> makeFrom(XMLStreamReader reader) throws XMLStreamException {                
        LocalElementHandler handler = new LocalElementHandler();
        Utils.processChildElements(reader, handler);
          
        return handler.getResult();
    }

    public List<ExampleDefinition> getAllExampleDefinitions() {
        return Collections.unmodifiableList(_examples);
    }
}
