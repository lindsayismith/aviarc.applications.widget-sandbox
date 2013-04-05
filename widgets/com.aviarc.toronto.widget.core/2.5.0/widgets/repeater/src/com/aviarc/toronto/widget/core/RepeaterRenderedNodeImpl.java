package com.aviarc.toronto.widget.core;

import org.w3c.dom.Element;
import org.w3c.dom.Node;

import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.DefaultRenderedWidgetImpl;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;

public class RepeaterRenderedNodeImpl extends DefaultRenderedWidgetImpl {

    public RepeaterRenderedNodeImpl(final ResolvedElementContext<CompiledWidget> resolvedContext,
                                    final ScreenRenderingContext renderingContext,
                                    final DefaultDefinitionFile definition) {
        super(resolvedContext, renderingContext, definition, false);
    }

    // Simply returns its child XHTML
    @Override
    public Node createXHTML(XHTMLCreationContext context) {
        Node n = context.getCurrentDocument().createDocumentFragment();
        
        Element elem = context.getCurrentDocument().createElement("div");
        elem.setAttribute("id", getAttributeValue("name") + ":div");
        n.appendChild(elem);
        
        Node child;
        for (RenderedNode node : getChildren()) {
            child = node.createXHTML(context);
            if (child != null) {
                elem.appendChild(child);
            }
        }
        return n;
    }
}
