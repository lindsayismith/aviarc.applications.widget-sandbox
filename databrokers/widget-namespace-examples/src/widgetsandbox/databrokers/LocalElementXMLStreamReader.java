package widgetsandbox.databrokers;

import javax.xml.namespace.NamespaceContext;
import javax.xml.namespace.QName;
import javax.xml.stream.Location;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;

public class LocalElementXMLStreamReader implements XMLStreamReader {

	public class MovedBeyondLocalElementException extends XMLStreamException {
		private static final long serialVersionUID = 1L;

		public MovedBeyondLocalElementException(String string) {
			super(string);
		}

	}

	private XMLStreamReader _delegate;
	private int _depth;

	public LocalElementXMLStreamReader(XMLStreamReader delegate) {
		// We have to be at a start element
		if (!delegate.isStartElement()) {
			throw new IllegalStateException("LocalElementXMLStreamReader must be initialized at the start of an element");
		}						
		_delegate = delegate;
		
		/* starts at 1.
		<top> 1
		   <next> 2
		      <next/> 3,2
		   </next> 1
		</top> 0
		*/
		_depth = 1;
			
	}
	
	public boolean isAtEndOfLocalElement() {
		return (this.isEndElement() && _depth == 0);
	}
	
	public void endLocalElement() throws XMLStreamException {
		while (_depth > 0) {
			this.next();
		}
	}
	
	public void close() throws XMLStreamException {
		// Closing the stream is not allowed for consumers
		// do nothing.
	}
	
	/*
	 * We have to implement this too as it does next() internally 
	 */
	public String getElementText() throws XMLStreamException {
		if (getEventType() != XMLStreamConstants.START_ELEMENT) {
			throw new XMLStreamException(
					"parser must be on START_ELEMENT to read next text",
					getLocation());
		}
		int eventType = this.next();
		StringBuffer content = new StringBuffer();
		while (eventType != XMLStreamConstants.END_ELEMENT) {
			if (eventType == XMLStreamConstants.CHARACTERS
					|| eventType == XMLStreamConstants.CDATA
					|| eventType == XMLStreamConstants.SPACE
					|| eventType == XMLStreamConstants.ENTITY_REFERENCE) {
				content.append(getText());
			} else if (eventType == XMLStreamConstants.PROCESSING_INSTRUCTION
					|| eventType == XMLStreamConstants.COMMENT) {
				// skipping
			} else if (eventType == XMLStreamConstants.END_DOCUMENT) {
				throw new XMLStreamException(
						"unexpected end of document when reading element text content");
			} else if (eventType == XMLStreamConstants.START_ELEMENT) {
				throw new XMLStreamException(
						"element text content may not contain START_ELEMENT",
						getLocation());
			} else {
				throw new XMLStreamException("Unexpected event type "
						+ eventType, getLocation());
			}
			eventType = this.next();
		}
		return content.toString();
	}
	
	
	// These ones are special
	public int next() throws XMLStreamException {
		// If we are at the end, we can't go on.
		if (isAtEndOfLocalElement()) {
			throw new MovedBeyondLocalElementException("Can't advance past end of the your local element");
		} 
		
		int next = _delegate.next(); 
		
		// If we're at a new element, increment depth		
		if (_delegate.isStartElement()) {
			_depth++;
		} else if (_delegate.isEndElement()) {
			_depth--;
		}
		
		return next;		
	}

	public int nextTag() throws XMLStreamException {
		int next = _delegate.nextTag(); 
		// If we're at a new element, increment depth	
		if (_delegate.isStartElement()) {
			_depth++;
		} else if (_delegate.isEndElement()) {
			_depth--;
		}		
		return next;
	}		
	

	
	public boolean hasNext() throws XMLStreamException {
		if (isAtEndOfLocalElement()) {
			return false;
		}		
		return _delegate.hasNext();
	}
	
	

	public int getAttributeCount() {
		return _delegate.getAttributeCount();
	}

	public String getAttributeLocalName(int arg0) {
		return _delegate.getAttributeLocalName(arg0);
	}

	public QName getAttributeName(int arg0) {
		return _delegate.getAttributeName(arg0);
	}

	public String getAttributeNamespace(int arg0) {
		return _delegate.getAttributeNamespace(arg0);
	}

	public String getAttributePrefix(int arg0) {
		return _delegate.getAttributePrefix(arg0);
	}

	public String getAttributeType(int arg0) {
		return _delegate.getAttributeType(arg0);
	}

	public String getAttributeValue(int arg0) {
		return _delegate.getAttributeValue(arg0);
	}

	public String getAttributeValue(String arg0, String arg1) {
		return _delegate.getAttributeValue(arg0, arg1);
	}

	public String getCharacterEncodingScheme() {
		return _delegate.getCharacterEncodingScheme();
	}

	

	public String getEncoding() {
		return _delegate.getEncoding();
	}

	public int getEventType() {
		return _delegate.getEventType();
	}

	public String getLocalName() {
		return _delegate.getLocalName();
	}

	public Location getLocation() {
		return _delegate.getLocation();
	}

	public QName getName() {
		return _delegate.getName();
	}

	public NamespaceContext getNamespaceContext() {
		return _delegate.getNamespaceContext();
	}

	public int getNamespaceCount() {
		return _delegate.getNamespaceCount();
	}

	public String getNamespacePrefix(int arg0) {
		return _delegate.getNamespacePrefix(arg0);
	}

	public String getNamespaceURI() {
		return _delegate.getNamespaceURI();
	}

	public String getNamespaceURI(int arg0) {
		return _delegate.getNamespaceURI(arg0);
	}

	public String getNamespaceURI(String arg0) {
		return _delegate.getNamespaceURI(arg0);
	}

	public String getPIData() {
		return _delegate.getPIData();
	}

	public String getPITarget() {
		return _delegate.getPITarget();
	}

	public String getPrefix() {
		return _delegate.getPrefix();
	}

	public Object getProperty(String arg0) throws IllegalArgumentException {
		return _delegate.getProperty(arg0);
	}

	public String getText() {
		return _delegate.getText();
	}

	public char[] getTextCharacters() {
		return _delegate.getTextCharacters();
	}

	public int getTextCharacters(int arg0, char[] arg1, int arg2, int arg3)
			throws XMLStreamException {
		return _delegate.getTextCharacters(arg0, arg1, arg2, arg3);
	}

	public int getTextLength() {
		return _delegate.getTextLength();
	}

	public int getTextStart() {
		return _delegate.getTextStart();
	}

	public String getVersion() {
		return _delegate.getVersion();
	}

	public boolean hasName() {
		return _delegate.hasName();
	}

	

	public boolean hasText() {
		return _delegate.hasText();
	}

	public boolean isAttributeSpecified(int arg0) {
		return _delegate.isAttributeSpecified(arg0);
	}

	public boolean isCharacters() {
		return _delegate.isCharacters();
	}

	public boolean isEndElement() {
		return _delegate.isEndElement();
	}

	public boolean isStandalone() {
		return _delegate.isStandalone();
	}

	public boolean isStartElement() {
		return _delegate.isStartElement();
	}

	public boolean isWhiteSpace() {
		return _delegate.isWhiteSpace();
	}

	

	public void require(int arg0, String arg1, String arg2)
			throws XMLStreamException {
		_delegate.require(arg0, arg1, arg2);
	}

	public boolean standaloneSet() {
		return _delegate.standaloneSet();
	}

	
}
