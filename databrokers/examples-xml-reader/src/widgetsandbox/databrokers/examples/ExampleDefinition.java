package widgetsandbox.databrokers.examples;

import java.io.StringReader;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;

import widgetsandbox.databrokers.Utils;
import widgetsandbox.databrokers.Utils.ElementHandler;
import widgetsandbox.databrokers.Utils.ResourceCompilationElementHandler;

import com.aviarc.framework.diagnostics.ResourceCompilationResult;

public class ExampleDefinition {
    String _title;
    String _description;
    String _XML;
    
    
    public ExampleDefinition(String title, String description, String xML) {
        super();
        _title = title;
        _description = description;
        _XML = xML;
    }
    
    public String getTitle() {
        return _title;
    }

    public String getDescription() {
        return _description;
    }

    public String getXML() {
        return _XML;
    }

    /**
     * Expecting:
     <example title="This is the title">
        <description>The description goes here</description>
        <XML>The XML goes here - CDATA should be allowed</XML>
     </example>

     */
    public static ResourceCompilationResult<ExampleDefinition> makeFrom(XMLStreamReader reader) throws XMLStreamException {        
        LocalElementHandler handler = new LocalElementHandler();
        handler.handleElement(reader);  
        return handler.getResult();
    }
    
    private static class LocalElementHandler extends ResourceCompilationElementHandler {
        String _title;
        String _description;
        String _XML;
        
        public void handleElement(XMLStreamReader reader) throws XMLStreamException {
            String title = reader.getAttributeValue(null,"title");
            if (title == null || title.length() == 0) {
                addError(reader.getLocation(),"There must be a 'title' attribute");
            } else {
                _title = title;
            }            
            Utils.processChildElements(reader, new ElementHandler() {

                public void handleElement(XMLStreamReader reader) throws XMLStreamException {                    
                    String name = reader.getLocalName();
                    if (name.equalsIgnoreCase("description")) {
                        _description = reader.getElementText();
                    } else if (name.equalsIgnoreCase("xml")) {
                        _XML = reader.getElementText();
                    }
                }                
            });
        }
        
        public ResourceCompilationResult<ExampleDefinition> getResult() {
            if (this.getResourceCompilationInfo().hasErrors()) {
                return new ResourceCompilationResult<ExampleDefinition>(null, this.getResourceCompilationInfo());
            } else {
                return new ResourceCompilationResult<ExampleDefinition>(new ExampleDefinition(_title, _description, _XML), this.getResourceCompilationInfo());
            }
                
        }                
        
    }
    
    public static void main(String[] args) throws XMLStreamException {
        String XML = "<example title=\"This is the title\">" + 
        "<description>The description goes here</description>" +
        "<XML><![CDATA[<test one=\"two\"/>]]></XML>" +
        "</example>";
        XMLInputFactory inputFactory = XMLInputFactory.newInstance();
        inputFactory.setProperty(XMLInputFactory.IS_COALESCING, true);
        
        XMLStreamReader reader = inputFactory.createXMLStreamReader(new StringReader(XML));
        Utils.nextElement(reader);
        ExampleDefinition.makeFrom(reader);
    }
}
