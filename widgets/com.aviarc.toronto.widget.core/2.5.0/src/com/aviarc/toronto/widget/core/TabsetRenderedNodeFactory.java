package com.aviarc.toronto.widget.core;

import java.util.ArrayList;
import java.util.List;

import org.w3c.dom.Node;

import com.aviarc.core.InterfaceQuery;
import com.aviarc.core.UnsupportedInterfaceException;
import com.aviarc.core.dataset.DatasetFieldName;
import com.aviarc.core.dataset.NoCurrentRowException;
import com.aviarc.core.dataset.NoSuchDatasetException;
import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.widget.AdvancedPositioningRenderedNodeFactory;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.DefaultRenderedNodeFactory;
import com.aviarc.framework.toronto.widget.DefaultRenderedWidgetImpl;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;
import com.aviarc.toronto.widget.core.TabRenderedNodeFactory.TabRenderedNode;


public class TabsetRenderedNodeFactory implements DefaultRenderedNodeFactory, AdvancedPositioningRenderedNodeFactory {

    private DefaultDefinitionFile _definitionFile;
    private static final long serialVersionUID = 1L;
    
    public void initialize(DefaultDefinitionFile definitionFile) {
        this._definitionFile = definitionFile;
    }

    public RenderedNode createRenderedNode(ResolvedElementContext<CompiledWidget> elementContext,
                                           ScreenRenderingContext renderingContext) {
        return new TabsetRenderedNode(elementContext, renderingContext, this._definitionFile);
    }
    
    public static class TabsetRenderedNode extends DefaultRenderedWidgetImpl implements RenderedNode {

        private List<TabRenderedNode> tabs = new ArrayList<TabRenderedNode>();
        private TabsetRenderer renderer;
        private int activeTabIndex;
        
        public TabsetRenderedNode(final ResolvedElementContext<CompiledWidget> resolvedContext,
                                  final ScreenRenderingContext renderingContext,
                                  final DefaultDefinitionFile definition) {
            super(resolvedContext, renderingContext, definition, false);
            renderer = new TabsetRenderer(this);
            this.addChildRenderedNodes();
        }
        
        @Override
        public DefaultDefinitionFile getDefinitionFile() {
            return super.getDefinitionFile();
        }
        
        @Override
        public void addChildRenderedNodes(ScreenRenderingContext screenRenderingContext) {
            int x = 0;
            for (RenderedNode rn : this.makeChildrenRenderedNodes(screenRenderingContext)) {
                if (rn != null) {
                    addChild(rn);
                    try {
                        // Need <tab/> children cast to the proper class
                        TabRenderedNode tab = InterfaceQuery.queryInterface(rn, TabRenderedNode.class);
                        tab.setTabsetRenderer(renderer);
                        tab.setTabIndex(x++);
                        tabs.add(tab);
                    } catch (UnsupportedInterfaceException e) {
                        // probably a when widget - just carry on
                        continue;
                    }
                }
            }
            chooseActiveTab();
        }
        
        public String getEmbeddedAppClassPrefix() {
            // Ensure that if we're embedding this widget that it gets the correct app name prefix
            if (getScreenRenderingContext().isEmbeddedScreen()) {
                String appName = getScreenRenderingContext().getCurrentState().getCurrentApplication().getName();
                return appName + "_";
            } else {
                return "";
            }
        }

        /**
         * Try the various available strategies for determining which tab to activate at startup
         * 
         * 1) 'current-tab-index' attribute
         * 2) 'active-tab-field' attribute - check dataset field
         * 3) first available tab
         * 4) give up and set no tab active
         * 
         * At each step, we only activate the tab if it is both enabled and visible.  If this condition cannot be filled, just move
         * on. 'current-tab-index' and 'active-tab-field' are mutually exclusive (see TabsetElementValidator), so only one of these
         * will ever be attempted before falling back to first available.
         */
        public void chooseActiveTab() {
            // explicit active tab
            String currentTabIndex = getAttributeValue("current-tab-index");
            if (currentTabIndex != null && !"".equals(currentTabIndex)) {
                try {
                    int index = Integer.parseInt(currentTabIndex);
                    TabRenderedNode tab = tabs.get(index);
                    if (tab != null && tab.isEnabled() && tab.isVisible()) {
                        this.activeTabIndex = index;
                        tab.setActive(true);
                        return;
                    }
                } catch (NumberFormatException ignored) { // Integer.parseInt(String)
                } catch (IndexOutOfBoundsException ignored) { // List.get(int)
                }
            }
            
            // If the user has set the attribute to pick the active tab from a dataset, do so
            String tabIndexFieldName = getAttributeValue("active-tab-field");
            if (tabIndexFieldName != null && !"".equals(tabIndexFieldName)) {
                DatasetFieldName tabIndexField = new DatasetFieldName(tabIndexFieldName);
                try {
                    int index = Integer.parseInt(getScreenRenderingContext()
                                                     .getCurrentState()
                                                     .getApplicationState()
                                                     .getDatasetStack()
                                                     .findDataset(tabIndexField.getDatasetName())
                                                     .getCurrentRowField(tabIndexField.getFieldName()));
                    TabRenderedNode tab = tabs.get(index);
                    if (tab.isEnabled() && tab.isVisible()) {
                        this.activeTabIndex = index;
                        tab.setActive(true);
                        return;
                    }
                // We can fall through to the next search strategy if we can't get a value.
                } catch (NoSuchDatasetException ignored) { // DatasetStack.findDataset(String)
                } catch (NoCurrentRowException ignored) { // Dataset.getCurrentRowField(String)
                } catch (NumberFormatException ignored) { // Integer.parseInt(String)
                }
            }
            
            // Fallback strategy - find the lowest-numbered available tab
            // TODO: if the field wasn't valid, should we set it now?
            for (TabRenderedNode tab : tabs) {
                if (tab.isEnabled() && tab.isVisible()) {
                    this.activeTabIndex = tab.getTabIndex();
                    tab.setActive(true);
                    return;
                }
            }
            
            // Last resort - no active tabs
            this.activeTabIndex = -1;
        }
        
        @Override
        public Node createXHTML(XHTMLCreationContext context) {
            renderer.render(context, getScreenRenderingContext().getCurrentState());
            XHTMLCreationContext childContext = makeChildContainerXHTMLCreationContext(context);
            for (TabRenderedNode tab : tabs) {
                tab.createXHTML(childContext);
            }
            return renderer.getTabsetRootElement();
        }

        public int getActiveTabIndex() {
            return this.activeTabIndex;
        }
        
        @Override
        public String getJavascriptDeclaration() {
            return String.format("new YAHOO.com.aviarc.framework.toronto.widget.core.v2_5_0.Tabset(%s)", getActiveTabIndex());
        }
        
    }

}
