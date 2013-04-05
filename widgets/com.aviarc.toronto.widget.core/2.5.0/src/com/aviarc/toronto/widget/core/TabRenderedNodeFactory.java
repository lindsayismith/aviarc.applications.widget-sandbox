package com.aviarc.toronto.widget.core;

import java.util.HashMap;
import java.util.Map;

import org.w3c.dom.Element;
import org.w3c.dom.Node;

import com.aviarc.core.datatype.AviarcBoolean;
import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.widget.AdvancedPositioningRenderedNodeFactory;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.DefaultRenderedNodeFactory;
import com.aviarc.framework.toronto.widget.DefaultRenderedWidgetImpl;
import com.aviarc.framework.xml.compilation.ResolvedElementAttribute;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;
import com.aviarc.toronto.widget.core.TabsetRenderedNodeFactory.TabsetRenderedNode;

public class TabRenderedNodeFactory implements DefaultRenderedNodeFactory, AdvancedPositioningRenderedNodeFactory {

    private DefaultDefinitionFile _definitionFile;
    private static final long serialVersionUID = 1L;
    
    public void initialize(DefaultDefinitionFile definitionFile) {
        this._definitionFile = definitionFile;
    }

    public RenderedNode createRenderedNode(ResolvedElementContext<CompiledWidget> elementContext,
                                           ScreenRenderingContext renderingContext) {
        return new TabRenderedNode(elementContext, renderingContext, this._definitionFile);
    }
    
    public static class TabRenderedNode extends DefaultRenderedWidgetImpl implements RenderedNode {

        public TabRenderedNode(final ResolvedElementContext<CompiledWidget> resolvedContext,
                               final ScreenRenderingContext renderingContext,
                               final DefaultDefinitionFile definition) {
            super(resolvedContext, renderingContext, definition);
        }
        
        private TabsetRenderer _renderer = null;
        private TabsetRenderedNode _tabset;
        private int _tabIndex = -1;
        private boolean _isActive = false;
        
        // Called by tabset if this tab will be active on render.
        public void setActive(boolean active) {
            _isActive = active;
        }
        
        public void setTabsetRenderer(TabsetRenderer renderer) {
            if (this._renderer != null) {
                throw new IllegalArgumentException("Tabset _renderer has already been set");
            }
            this._renderer = renderer;
            this._tabset = renderer.getTabset();
        }
        
        @Override
        public Node createXHTML(XHTMLCreationContext context) {
            Element tabBody = _renderer.renderTabElements(this, context, getScreenRenderingContext().getCurrentState());
            XHTMLCreationContext childContext = makeChildContainerXHTMLCreationContext(context);
            for (RenderedNode node : getChildren()) {
                Node child = node.createXHTML(childContext);
                if (child != null) {
                    tabBody.appendChild(child);
                }
            }
            return null;
        }
        
        public ResolvedElementContext<CompiledWidget> getElementContext() {
            return getResolvedElementContext();
        }
        
        @Override
        public Map<String, String> getAttributesForJavascriptDeclaration() {
            Map<String, String> attributesMap = new HashMap<String, String>();
            for (ResolvedElementAttribute attr : this.getResolvedElementContext().getAllAttributes()) {
                attributesMap.put(attr.getName(), attr.getResolvedValue());
            }
            attributesMap.put("tab-index", String.valueOf(this._tabIndex));
            attributesMap.put("_is-active", this._isActive ? "y" : "n");
            return attributesMap;
        }
        
        public boolean isVisible() {
            return AviarcBoolean.valueOf(this.getAttributeValue("visible")).booleanValue();
        }

        public boolean isEnabled() {
            return AviarcBoolean.valueOf(this.getAttributeValue("enabled")).booleanValue();
        }

        public boolean isCurrentTab() {
            return this._tabIndex == _tabset.getActiveTabIndex();
        }
        
        public void setTabIndex(int index) {
            if (this._tabIndex != -1) {
                throw new IllegalArgumentException("Tab index has already been set");
            }
            this._tabIndex = index;
        }
        
        public int getTabIndex() {
            return this._tabIndex;
        }
        
        @Override
        public String getJavascriptDeclaration() {
            String cssPrefix = _tabset.getEmbeddedAppClassPrefix() + _tabset.getDefinitionFile().getCssPrefix();
            return String.format("new YAHOO.com.aviarc.framework.toronto.widget.core.v2_5_0.Tab(%s, %s, \"%s\")",
                                 getTabIndex(), isCurrentTab(), cssPrefix);
        }
    }
}
