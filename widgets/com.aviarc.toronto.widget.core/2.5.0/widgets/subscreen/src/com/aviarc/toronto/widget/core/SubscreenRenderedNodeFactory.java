package com.aviarc.toronto.widget.core;

import java.util.ArrayList;
import java.util.List;

import org.w3c.dom.Element;
import org.w3c.dom.Node;

import com.aviarc.core.InterfaceQuery;
import com.aviarc.core.UnsupportedInterfaceException;
import com.aviarc.core.exceptions.AviarcRuntimeException;
import com.aviarc.core.exceptions.CannotCreateScreenException;
import com.aviarc.core.screen.Screen;
import com.aviarc.core.screen.ScreenManager;
import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.screen.ScreenRenderingContextImpl;
import com.aviarc.framework.toronto.screen.TorontoScreenImpl;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.DefaultNameManagerImpl;
import com.aviarc.framework.toronto.widget.DefaultRenderedNodeFactory;
import com.aviarc.framework.toronto.widget.DefaultRenderedWidgetImpl;
import com.aviarc.framework.toronto.widget.NameManager;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;

public class SubscreenRenderedNodeFactory implements DefaultRenderedNodeFactory {
    private static final long serialVersionUID = 1L;
    public static class SubScreenRenderedNode extends DefaultRenderedWidgetImpl implements RenderedNode {

        public SubScreenRenderedNode(final ResolvedElementContext<CompiledWidget> resolvedContext,
                                     final ScreenRenderingContext renderingContext, 
                                     final DefaultDefinitionFile definition,
                                     final List<RenderedNode> subScreenBody) {
            super(resolvedContext, renderingContext, definition, false);
            
            for (RenderedNode rn : subScreenBody) {
                this.addChild(rn);
            }
        }

        @Override
        public Node createXHTML(XHTMLCreationContext context) {
            // Subscreens are a div with the body inside them. Container positioning will set styles on it
            Element divElement = context.getCurrentDocument().createElement("div");
            divElement.setAttribute("id", this.getAttributeValue("name") + ":div");
            Node child;
            for (RenderedNode rn : this.getChildren()) {
                child = rn.createXHTML(context);
                if (child != null) {
                    divElement.appendChild(child);
                }
            }
            return divElement;
        }
    }

    private DefaultDefinitionFile _definitionFile;

    public RenderedNode createRenderedNode(ResolvedElementContext<CompiledWidget> elementContext,
                                           final ScreenRenderingContext renderingContext) {
        
        // We do return a node, it forms the outer widget object and outer div
        // The children though are the layout part of the referenced subscreen.
        String subScreenName = elementContext.getAttribute("screen").getResolvedValue();
        
        Screen subScreen;
        TorontoScreenImpl torontoScreen;
        try {
            ScreenManager screenMgr = renderingContext.getCurrentState().getCurrentApplication().getScreenManager();
            subScreen = screenMgr.getScreenRegistration(subScreenName).getRegisteredItem();
            torontoScreen = InterfaceQuery.queryInterface(subScreen, TorontoScreenImpl.class);
        } catch (CannotCreateScreenException e) {
            throw new AviarcRuntimeException("Subscreen widget cannot retrieve referenced subscreen '" + subScreenName + "'", e);
        } catch (UnsupportedInterfaceException e) {
            throw new AviarcRuntimeException(String.format(
                    "The Screen named '%s' referenced by the subscreen widget is not a TorontoScreenImpl", subScreenName));
        }
        
        List<CompiledWidget> subScreenBody = torontoScreen.getScreenBody();
        // Form the rendered tree from this, with a new context that establishes a new naming context
        String widgetName = elementContext.getAttribute("name").getResolvedValue();
        final NameManager subScreenNameManager =  new DefaultNameManagerImpl(widgetName);
        ScreenRenderingContext newContext = new ScreenRenderingContextImpl(renderingContext.getCurrentState(),
                                                                           subScreenNameManager,
                                                                           renderingContext.getNextKID(),
                                                                           renderingContext.isEmbeddedScreen(),
                                                                           renderingContext.getContainingScreenName()); 

        List<RenderedNode> renderedBody = new ArrayList<RenderedNode>();
        RenderedNode rn;
        for (CompiledWidget cwn : subScreenBody) {
            rn = cwn.createRenderedNode(newContext);
            if (rn != null) {
                renderedBody.add(rn);
            }
        }
        
        return new SubScreenRenderedNode(elementContext,
                                         newContext,
                                        _definitionFile,
                                        renderedBody);
    }

    public void initialize(DefaultDefinitionFile definitionFile) {
        _definitionFile = definitionFile;        
    }

}
