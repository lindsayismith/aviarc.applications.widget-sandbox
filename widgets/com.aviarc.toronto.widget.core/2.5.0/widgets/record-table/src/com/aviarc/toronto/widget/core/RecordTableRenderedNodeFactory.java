package com.aviarc.toronto.widget.core;

import com.aviarc.core.exceptions.AviarcRuntimeException;
import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.util.JavascriptUtils;
import com.aviarc.framework.toronto.util.Tools;
import com.aviarc.framework.toronto.util.Tools.SymbolNotFoundException;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.xslt.DefaultXSLTRenderedNodeImpl;
import com.aviarc.framework.toronto.widget.xslt.XSLTRenderedNodeFactory;
import com.aviarc.framework.xml.compilation.ResolvedElementAttribute;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.transform.Templates;

public class RecordTableRenderedNodeFactory implements XSLTRenderedNodeFactory {
    
    private static final long serialVersionUID = 1;
    private DefaultDefinitionFile _definitionFile;
    private Templates _widgetTemplate;

    public void initialize(DefaultDefinitionFile definitionFile, Templates widgetTemplate) {
        this._definitionFile = definitionFile;
        this._widgetTemplate = widgetTemplate;
    }
    
    public RenderedNode createRenderedNode(ResolvedElementContext<CompiledWidget> elementContext,
                                            ScreenRenderingContext renderingContext) {
        return new RecordTableRenderedNode(elementContext, renderingContext, _definitionFile, _widgetTemplate);
    }
    
    private static class RecordTableRenderedNode extends DefaultXSLTRenderedNodeImpl implements RenderedNode {

        public RecordTableRenderedNode(final ResolvedElementContext<CompiledWidget> resolvedContext,
                                       final ScreenRenderingContext renderingContext,
                                       final DefaultDefinitionFile definition,
                                       final Templates templates) {
            super(resolvedContext, renderingContext, definition, templates);
        }
        
        @Override
        public String getJavascriptDeclaration() {
            Map<String, String> attributesMap = getAttributesForJavascriptDeclaration();
            List<Map<String, String>> columnAttributes = extractColumnAttributes();
            
            String javascriptConstructor =
                String.format("new YAHOO.com.aviarc.framework.toronto.widget.core.v2_5_0.RecordTable(%s)",
                              makeColumnsDefinition(columnAttributes));
            
            try {
                return Tools.replaceSymbols(javascriptConstructor, attributesMap);
            }
            catch (SymbolNotFoundException e) {
                throw new AviarcRuntimeException(e);
            }
        }
        
        /**
         * Extract the names and values of all defined attributes for all columns
         */
        private List<Map<String, String>> extractColumnAttributes() {
            final List<Map<String, String>> columnAttributes = new ArrayList<Map<String, String>>();
            for (ResolvedElementContext<CompiledWidget> column : this.getResolvedElementContext().getSubElements("column")) {
                Map<String, String> attributes = new HashMap<String, String>();
                for (ResolvedElementAttribute attr : column.getAllAttributes()) {
                    attributes.put(attr.getName(), attr.getResolvedValue());
                }
                columnAttributes.add(attributes);
            }   
            return columnAttributes;
        }
        
        /**
         * Make the definition array for this record table's columns
         * [
         *     {'index':'0', 'attributes':{'name1':'value1','name2':'value2',...,'nameN':'valueN'}},
         *     {'index':'1', 'attributes':{'name1':'value1','name2':'value2',...,'nameN':'valueN'}},
         *     ...
         *     {'index':'N-1', 'attributes':{'name1':'value1','name2':'value2',...,'nameN':'valueN'}},
         * ]
         */
        private String makeColumnsDefinition(List<Map<String, String>> columns) {
            StringBuilder output = new StringBuilder();
            output.append('[');
            int x = 0;
            for (Map<String, String> column : columns) {
                if (x != 0) {
                    output.append(',');
                }
                output.append(String.format("{'index':'%d','attributes':%s}",
                                            x++,
                                            JavascriptUtils.makeJSONObjectFromMap(column)));
            }
            output.append(']');
            return output.toString();
        }
        
    }
    
}
