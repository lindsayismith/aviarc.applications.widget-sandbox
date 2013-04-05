package widgetsandbox.databrokers;

import javax.xml.stream.Location;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;

import com.aviarc.core.diagnostics.ResourceCompilationInfo;
import com.aviarc.core.diagnostics.SimpleResourceDiagnostic;

public class Utils {
	
	/**
	 * Find next start_element or end_element regardless of whats in between
	 * 
	 * @param reader
	 * @return
	 * @throws XMLStreamException
	 */
	public static int nextElement(XMLStreamReader reader) throws XMLStreamException {
		int result = reader.next();
		while (!reader.isStartElement() && !reader.isEndElement()) {
			result = reader.next();
		}
		return result; 		
	}
	
	/**
	 * When at start_element, move to the end_element;
	 * @param reader
	 * @return
	 * @throws XMLStreamException 
	 */
	public static int skipElement(XMLStreamReader reader) throws XMLStreamException {
		
		if (!reader.isStartElement()) {
            throw new IllegalStateException("skipElement only valid when currently at START_ELEMENT");
        }
		
        int depth = 1; // need one more end elements than start elements
        int result;
        while (true) {
            result = reader.next();
            if (reader.isStartElement()) {
                ++depth;
            } else if (reader.isEndElement()) {
            	--depth;                
            }            
            if (depth == 0) {
            	return result;
            }
        }                
	}
	
	public interface ElementHandler {
        void handleElement(XMLStreamReader reader) throws XMLStreamException;
    }

    public static void processChildElements(XMLStreamReader reader, ElementHandler elementHandler) throws XMLStreamException {
        // The plan here is that handler is called for each child element
        // It only works if the handler, when given the reader, must return with the 
        // reader having ended the element that is started when you give it to it.
        
        if (!reader.isStartElement()) {
        	throw new IllegalStateException("processChildElements must be called with reader pointing at the start of an element");
        }
        
        // Keep going until we get to our end
        while (true) {
			// advance
			nextElement(reader);
								
			if (reader.isEndElement()) {
				// no more
				break;
			} 
			
			LocalElementXMLStreamReader elementReader = new LocalElementXMLStreamReader(reader);
			elementHandler.handleElement(elementReader);					
			elementReader.endLocalElement();									
		}                    
    }
    
    public static abstract class ResourceCompilationElementHandler implements ElementHandler {
    	private ResourceCompilationInfo _compileInfo;

		public ResourceCompilationElementHandler(ResourceCompilationInfo compileInfo) {
    		_compileInfo = compileInfo;    		
    	}
		
		public ResourceCompilationElementHandler() {
            this(new ResourceCompilationInfo());
        }
    	
		public ResourceCompilationInfo getResourceCompilationInfo() {
			return _compileInfo;
		}
		
		protected void addError(Location location, String message) {
			_compileInfo.add(new SimpleResourceDiagnostic(null,
					null,
					String.format("Line %s, column %s", location.getLineNumber(), location.getColumnNumber()),
					message,
					true));	
		}
		
		protected void addWarning(Location location, String message) {
			_compileInfo.add(new SimpleResourceDiagnostic(null,
					null,
					String.format("Line %s, column %s", location.getLineNumber(), location.getColumnNumber()),
					message,
					false));	
		}
		
    	
    }
}
