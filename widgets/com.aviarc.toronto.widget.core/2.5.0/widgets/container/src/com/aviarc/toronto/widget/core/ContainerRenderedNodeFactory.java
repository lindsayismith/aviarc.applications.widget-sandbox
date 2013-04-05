package com.aviarc.toronto.widget.core;

import static com.aviarc.framework.toronto.util.CssUtils.makeClassString;

import java.util.Map;

import org.w3c.dom.Element;
import org.w3c.dom.Node;

import com.aviarc.core.datatype.AviarcBoolean;
import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.DefaultRenderedNodeFactory;
import com.aviarc.framework.toronto.widget.DefaultRenderedWidgetImpl;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;

public class ContainerRenderedNodeFactory implements DefaultRenderedNodeFactory {

    private static final long serialVersionUID = 1L;
    public static class ContainerRenderedNode extends DefaultRenderedWidgetImpl {

        public ContainerRenderedNode(final ResolvedElementContext<CompiledWidget> resolvedContext,
                                  final ScreenRenderingContext renderingContext,
                                  final DefaultDefinitionFile definition) {
            super(resolvedContext, renderingContext, definition);
        }

        public Node createXHTML(XHTMLCreationContext context) {
            Element container = context.getCurrentDocument().createElement("div");
            Map<String, String> attributes = getResolvedAttributes();
            String cssClass = makeClassString(getDefinitionFile().getCssPrefix() + "container", attributes.get("class"));
            if (!AviarcBoolean.valueOf(attributes.get("visible")).booleanValue()) {
                cssClass = cssClass + " display-none";
            }
            container.setAttribute("class", cssClass);
            container.setAttribute("id", attributes.get("name") + ":div");
	    container.setAttribute("title", attributes.get("tooltip"));
            for (RenderedNode childWidget : getChildren()) {
                Node childHtml = childWidget.createXHTML(context);
                if (childHtml != null) {
                    container.appendChild(childHtml);
                }
            }
            return container;
        }

    }

    private DefaultDefinitionFile definitionFile;
    public void initialize(DefaultDefinitionFile definitionFile) {
        this.definitionFile = definitionFile;
    }

    public RenderedNode createRenderedNode(ResolvedElementContext<CompiledWidget> elementContext,
                                           ScreenRenderingContext renderingContext) {
        return new ContainerRenderedNode(elementContext, renderingContext,  definitionFile);
    }

}


