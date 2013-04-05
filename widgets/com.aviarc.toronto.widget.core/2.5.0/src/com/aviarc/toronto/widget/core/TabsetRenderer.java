package com.aviarc.toronto.widget.core;

import static com.aviarc.core.util.CollectionUtils.list;
import static com.aviarc.framework.toronto.util.CssUtils.joinCssAttributes;

import java.util.List;
import java.util.Map;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;

import com.aviarc.core.datatype.AviarcBoolean;
import com.aviarc.core.state.State;
import com.aviarc.framework.toronto.screen.RenderedNode.XHTMLCreationContext;
import com.aviarc.framework.toronto.util.CssUtils;
import com.aviarc.framework.util.BrowserDetection;
import com.aviarc.framework.xml.compilation.ResolvedElementAttribute;
import com.aviarc.toronto.widget.core.TabRenderedNodeFactory.TabRenderedNode;
import com.aviarc.toronto.widget.core.TabsetRenderedNodeFactory.TabsetRenderedNode;

public class TabsetRenderer {
    
    private static final List<String> tabsetRetainAttributes =
        list("padding-top", "padding-bottom", "padding-left", "padding-right", "min-height", "min-width");
    
    private Element _activeTabBar;
    private Element _inactiveTabBar;
    private Element _tabContent;
    private Element _tabsetRoot;
    private String _tabsetClassList;
    private Document _parentDocument;
    private TabsetRenderedNode _tabset;
    private String _cssPrefix;
    private String _embeddedAppClassPrefix;
    
    public TabsetRenderer(final TabsetRenderedNode tabset) {
        this._tabset = tabset;
        this._cssPrefix = tabset.getDefinitionFile().getCssPrefix();
        _embeddedAppClassPrefix = tabset.getEmbeddedAppClassPrefix();
    }

    private String makeClassString(String component, String classList, String embeddedAppClassPrefix, String prefix) {
        String baseClass = String.format("%s%s%s", embeddedAppClassPrefix, prefix, component);
        return com.aviarc.framework.toronto.util.CssUtils.makeClassString(baseClass, classList);
    }
    private String makeClassString(String component, String classList) {
        return makeClassString(component, classList, _embeddedAppClassPrefix, _cssPrefix);
    }
    private String makeClassString(String component) {
        return makeClassString(component, _tabsetClassList, _embeddedAppClassPrefix, _cssPrefix);
    }
    private void addTabsetCssClass(Element element, String componentName) {
        element.setAttribute("class", makeClassString(componentName));
    }
    
    public void render(XHTMLCreationContext context, State state) {
        Document doc = context.getCurrentDocument();
        this._parentDocument = doc;
        this._tabsetClassList = _tabset.getAttributeValue("class");
        
        Element tabsetRoot = doc.createElement("div");
        String invisibleClass = AviarcBoolean.valueOf(_tabset.getAttributeValue("visible")).booleanValue() ? "" : "display-none";
        tabsetRoot.setAttribute("class", String.format("%s %s", makeClassString("tabset"), invisibleClass));
        tabsetRoot.setAttribute("id", String.format("%1$s:div", _tabset.getAttributeValue("name")));
        boolean isIE6 = BrowserDetection.isIE6(state.getRequestState());
        String style = joinCssAttributes(context.getPositioningHelper().generateCSS(_tabset.getResolvedAttributes(true), isIE6));
        tabsetRoot.setAttribute("style", style);
        this._tabsetRoot = tabsetRoot;
        
        // <div class="tabset-inactive-tab-row">
        //   <ul class="tabset-tablist"></ul>
        // </div>
        Element inactiveTabBarDiv = doc.createElement("div");
        addTabsetCssClass(inactiveTabBarDiv, "tabset-inactive-tab-row");
        tabsetRoot.appendChild(inactiveTabBarDiv);
        Element inactiveTabBarUl = doc.createElement("ul");
        addTabsetCssClass(inactiveTabBarUl, "tabset-tablist");
        inactiveTabBarDiv.appendChild(inactiveTabBarUl);
        this._inactiveTabBar = inactiveTabBarUl;
        
        // Left and right scrolling.  Leaving this disabled right now
        // TODO: org.w3c
        /*
                parent.addElement("div")
                        .addAttribute("id", String.format("%1$s:scroller-left", tabsetId)) 
                        .addAttribute("class", "tabset-scroller tabset-scroller-left tabset-scroller-disabled");
                parent.addElement("div")
                        .addAttribute("id", String.format("%1$s:scroller-right", tabsetId))
                        .addAttribute("class", "tabset-scroller tabset-scroller-right tabset-scroller-disabled");

         */
        
        // <div class="tabset-body">
        // This needs some special handling to cope with tabs that have classes of their own
        //TODO: makeTabsetBodyClassString(_tabsetClassList, currentTab)
        Element tabsetBody = doc.createElement("div");
        addTabsetCssClass(tabsetBody, "tabset-body");
        tabsetRoot.appendChild(tabsetBody);
        
        // <div class="tabset-background"></div>
        Element tabsetBackground = doc.createElement("div");
        addTabsetCssClass(tabsetBackground, "tabset-background");
        tabsetBody.appendChild(tabsetBackground);
        
        //m <div class="tabset-body-top">
        //   <div class="tabset-body-top-left"></div>
        //   <div class="tabset-body-top-horizontal"></div>
        //   <div class="tabset-body-top-right"></div>
        // </div>
        Element tabsetBodyTop = doc.createElement("div");
        addTabsetCssClass(tabsetBodyTop, "tabset-body-top");
        tabsetBody.appendChild(tabsetBodyTop);
        for (String component : list("left", "horizontal", "right")) {
            Element el = doc.createElement("div");
            addTabsetCssClass(el, String.format("tabset-body-top-%s", component));
            tabsetBodyTop.appendChild(el);
        }
        
        // <div class="tabset-body-bottom">
        //   <div class="tabset-body-bottom-left"></div>
        //   <div class="tabset-body-bottom-horizontal"></div>
        //   <div class="tabset-body-bottom-right"></div>
        // </div>
        Element tabsetBodyBottom = doc.createElement("div");
        addTabsetCssClass(tabsetBodyBottom, "tabset-body-bottom");
        tabsetBody.appendChild(tabsetBodyBottom);
        for (String component : list("left", "horizontal", "right")) {
            Element el = doc.createElement("div");
            addTabsetCssClass(el, String.format("tabset-body-bottom-%s", component));
            tabsetBodyBottom.appendChild(el);
        }

        // <div class="tabset-body-left"></div>
        // <div class="tabset-body-right"></div>
        for (String component : list("left", "right")) {
            Element el = doc.createElement("div");
            addTabsetCssClass(el, String.format("tabset-body-%s", component));
            tabsetBody.appendChild(el);
        }
        
        // <div class="tabset-active-tab-row">
        //   <ul class="tabset-tablist"></ul>
        // </div>
        Element activeTabBarDiv = doc.createElement("div");
        addTabsetCssClass(activeTabBarDiv, "tabset-active-tab-row");
        tabsetBody.appendChild(activeTabBarDiv);
        Element activeTabBarUl = doc.createElement("ul");
        addTabsetCssClass(activeTabBarUl, "tabset-tablist");
        activeTabBarDiv.appendChild(activeTabBarUl);
        this._activeTabBar = activeTabBarUl;
        
        // <div class="tabset-body-content"></div>
        Element tabsetBodyContent = doc.createElement("div");
        addTabsetCssClass(tabsetBodyContent, "tabset-body-content");
        tabsetBody.appendChild(tabsetBodyContent);
        this._tabContent = tabsetBodyContent;
    }
    

    public Element getTabsetRootElement() {
        return _tabsetRoot; 
    }

    /**
     * Construct markup for one tab, returning a reference to the tab body element (where the tab's children will be rendered)
     * @param context 
     * @param state 
     */
    public Element renderTabElements(TabRenderedNode tab, XHTMLCreationContext context, State state) {
        String name = getTabAttribute(tab, "name");
        
        // Make the Tab element (<li>), clone it, and put it in the tab bars
        Element activeTab = makeTabElements(tab);
        Element inactiveTab = (Element) activeTab.cloneNode(true);
        
        activeTab.setAttribute("id", String.format("%s:active-tab", name));
        this._activeTabBar.appendChild(activeTab);
        
        inactiveTab.setAttribute("id", String.format("%s:inactive-tab", name));
        this._inactiveTabBar.appendChild(inactiveTab);
        
        // Make the tab body element
        Element tabBody = _parentDocument.createElement("div");
        tabBody.setAttribute("id", String.format("%s:content", name));
        tabBody.setAttribute("class", makeClassString(String.format("tabset-tab-content-%s", makeVisibilityClass(tab))));
        boolean isIE6 = BrowserDetection.isIE6(state.getRequestState());
        Map<String, String> generatedCSS = context.getPositioningHelper().generateCSS(tab.getResolvedAttributes(true), isIE6);
        generatedCSS.keySet().retainAll(tabsetRetainAttributes);
        tabBody.setAttribute("style", CssUtils.joinCssAttributes(generatedCSS));
        this._tabContent.appendChild(tabBody);
        
        return tabBody;
    }
    
    private String getTabAttribute(TabRenderedNode tab, String key) {
        ResolvedElementAttribute attribute = tab.getElementContext().getAttribute(key); 
        return attribute == null ? null : attribute.getResolvedValue();
    }
    
    private String makeVisibilityClass(TabRenderedNode tab) {
        if (!tab.isVisible()) {
            return "hidden";
        } else if (!tab.isEnabled()) {
            return "disabled";
        } else if (tab.isCurrentTab()) {
            return "active";
        } else {
            return "inactive";
        }
    }

    /**
     * Add a text node to the given element, if the text specified by the given attribute is not null
     */
    private void addText(TabRenderedNode tab, String textAttribute, Element target) {
        String text = getTabAttribute(tab, textAttribute);
        if (text != null) {
            Node textNode = _parentDocument.createTextNode(text);
            target.appendChild(textNode);
        }
    }
    
    /**
     * Construct a tab tooltip, using the tooltip attribute if present, otherwise "label-left + label + label-right", omitting
     * empty text elements.
     */
    private String makeToolTip(TabRenderedNode tab) {
        String tooltip = getTabAttribute(tab, "tooltip");
        
        if (tooltip == null) {
            boolean empty = true;
            StringBuilder tt = new StringBuilder();
            
            String labelLeft = getTabAttribute(tab, "label-left");
            if (labelLeft != null) {
                tt.append(labelLeft);
                empty = false;
            }
            
            String label = getTabAttribute(tab, "label");
            if (label != null) {
                if (!empty) {
                    tt.append(' ');
                }
                tt.append(label);
                empty = false;
            }
            
            String labelRight = getTabAttribute(tab, "label-right");
            if (labelRight != null) {
                if (!empty) {
                    tt.append(' ');
                }
                tt.append(labelRight);
            }
            tooltip = tt.toString();
        }
        
        return tooltip;
    }

    /**
     * Make a &lt;li&gt; to represent an interactive tab element
     */
    private Element makeTabElements(TabRenderedNode tab) {
        // CSS classlists will only be applied to li and its direct descendent a and span to avoid cluttering the code
        String tabClassList = getTabAttribute(tab, "class");
        
        Element li = _parentDocument.createElement("li");
        li.setAttribute("class", makeClassString(String.format("tab-%s", makeVisibilityClass(tab)), tabClassList));
        li.setAttribute("title", makeToolTip(tab));

       
        //   <a class="tab-anchor" onclick="return false;">
        //     <span class="tab-left"/>
        //     <span class="tab-label-left"/>
        //     <span class="inactive-label">{@label}</span>
        //     <span class="active-label-spacer">{@label}</span>
        //     <span class="tab-label-right"/>
        //     <span class="tab-right"/>
        //   </a>
        Element a = _parentDocument.createElement("a");
        a.setAttribute("class", makeClassString("tab-anchor", tabClassList));
        //a.setAttribute("onclick", "return false;");
        a.setAttribute("href", "javascript:void(0);");
        li.appendChild(a);
        
        Element tabAnchorLeft = _parentDocument.createElement("span");
            tabAnchorLeft.setAttribute("class", "tab-left");
            a.appendChild(tabAnchorLeft);
        Element tabAnchorLabelLeft = _parentDocument.createElement("span");
            tabAnchorLabelLeft.setAttribute("class", "tab-label-left");
            addText(tab, "label-left", tabAnchorLabelLeft);
            a.appendChild(tabAnchorLabelLeft);
        Element tabAnchorInactiveLabel = _parentDocument.createElement("span");
            tabAnchorInactiveLabel.setAttribute("class", "tab-inactive-label");
            addText(tab, "label", tabAnchorInactiveLabel);
            a.appendChild(tabAnchorInactiveLabel);
        Element tabAnchorActiveLabelSpacer = _parentDocument.createElement("span");
            tabAnchorActiveLabelSpacer.setAttribute("class", "tab-active-label-spacer");
            addText(tab, "label", tabAnchorActiveLabelSpacer);
            a.appendChild(tabAnchorActiveLabelSpacer);
        Element tabAnchorLabelRight = _parentDocument.createElement("span");
            tabAnchorLabelRight.setAttribute("class", "tab-label-right");
            addText(tab, "label-right", tabAnchorLabelRight);
            a.appendChild(tabAnchorLabelRight);
        Element tabAnchorRight = _parentDocument.createElement("span");
            tabAnchorRight.setAttribute("class", "tab-right");
            a.appendChild(tabAnchorRight);
        
        //   <span class="tab-span">
        //     <span class="tab-left"/>
        //     <span class="tab-label-left"/>
        //     <span class="tab-label">{@label}</span>
        //     <span class="tab-label-right"/>
        //     <span class="tab-right"/>
        //   </span>
        Element span = _parentDocument.createElement("span");
        span.setAttribute("class", makeClassString("tab-span", tabClassList));
        li.appendChild(span);
        
        Element tabSpanLeft = _parentDocument.createElement("span");
            tabSpanLeft.setAttribute("class", "tab-left");
            span.appendChild(tabSpanLeft);
        Element tabSpanLabelLeft = _parentDocument.createElement("span");
            tabSpanLabelLeft.setAttribute("class", "tab-label-left");
            addText(tab, "label-left", tabSpanLabelLeft);
            span.appendChild(tabSpanLabelLeft);
        Element tabSpanLabel = _parentDocument.createElement("span");
            tabSpanLabel.setAttribute("class", "tab-label");
            addText(tab, "label", tabSpanLabel);
            span.appendChild(tabSpanLabel);
        Element tabSpanLabelRight = _parentDocument.createElement("span");
            tabSpanLabelRight.setAttribute("class", "tab-label-right");
            addText(tab, "label-right", tabSpanLabelRight);
            span.appendChild(tabSpanLabelRight);
        Element tabSpanRight = _parentDocument.createElement("span");
            tabSpanRight.setAttribute("class", "tab-right");
            span.appendChild(tabSpanRight);
        
        return li;
    }

    public TabsetRenderedNode getTabset() {
        return _tabset;
    }
   
}
