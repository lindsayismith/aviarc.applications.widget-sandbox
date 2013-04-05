package com.aviarc.toronto.widget.core;

import static com.aviarc.core.util.CollectionUtils.list;

import java.util.ArrayList;
import java.util.List;

import org.w3c.dom.Node;

import com.aviarc.core.datatype.AviarcBoolean;
import com.aviarc.core.util.StringUtils;
import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.screen.ScreenRequirementsCollector;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.DefaultRenderedNodeFactory;
import com.aviarc.framework.toronto.widget.DefaultRenderedWidgetImpl;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;

public class ScreenPropertiesRenderedNodeFactory implements DefaultRenderedNodeFactory {
    private static final long serialVersionUID = 1L;
    public class ScreenPropertiesRenderedNode extends DefaultRenderedWidgetImpl implements RenderedNode {

        public ScreenPropertiesRenderedNode(final ResolvedElementContext<CompiledWidget> resolvedContext,
                                            final ScreenRenderingContext renderingContext, 
                                            final DefaultDefinitionFile definition) {
            super(resolvedContext, renderingContext, definition);  
        }

        @Override
        public void registerRequirements(ScreenRequirementsCollector collector) {
            // All the usual dataset / action requirements are handled by super class
            super.registerRequirements(collector);
            
            // Need support at the include controller level for www/ includes and also in the collector interface
            for (ResolvedElementContext<CompiledWidget> includes : this.getResolvedElementContext().getSubElements("include")) {
                collector.requireWwwJSInclude(includes.getAttribute("url").getResolvedValue());
            }
            
            for (ResolvedElementContext<CompiledWidget> includes : this.getResolvedElementContext().getSubElements("css-include")) {
                collector.requireWwwCSSInclude(includes.getAttribute("url").getResolvedValue());
            }
            
            /*
             * Add <meta name="viewport"> if provided a //screen-properties/mobile-viewport element
             */
            List<ResolvedElementContext<CompiledWidget>> subElements =
                    this.getResolvedElementContext().getSubElements("mobile-viewport");
            if (subElements.size() > 0) {
                ResolvedElementContext<CompiledWidget> viewPort = subElements.get(0);
                List<String> viewportAttributes = new ArrayList<String>();
                // http://learnthemobileweb.com/2009/07/mobile-meta-tags/
                boolean scalable = AviarcBoolean.valueOf(viewPort.getAttribute("user-scalable").getResolvedValue()).booleanValue();
                viewportAttributes.add(String.format("user-scalable=%s", scalable ? "yes" : "no"));
                for (String attribute : list("width", "height")) {
                    if (viewPort.hasAttribute(attribute)) {
                        viewportAttributes.add(String.format("%s=%s",
                                                             attribute, viewPort.getAttribute(attribute).getResolvedValue()));
                    }
                }
                for (String attribute : list("initial-scale", "maximum-scale", "minimum-scale")) {
                    if (viewPort.hasAttribute(attribute)) {
                        // range 0.25 <= x <= 10
                        double parsedAttribute =
                                Math.min(Math.max(Float.parseFloat(viewPort.getAttribute(attribute).getResolvedValue()), 0.25), 10);
                        viewportAttributes.add(String.format("%s=%.2f", attribute, parsedAttribute));
                    }
                }
                collector.requireMetaTag(StringUtils.join(viewportAttributes, ", "), "viewport", null, null);
            }
        }

        @Override
        public Node createXHTML(XHTMLCreationContext context) {
            return null;
        }
    }

    private DefaultDefinitionFile _definitionFile;

    public void initialize(DefaultDefinitionFile definitionFile) {
        _definitionFile = definitionFile;
    }

    public RenderedNode createRenderedNode(ResolvedElementContext<CompiledWidget> elementContext,
                                           ScreenRenderingContext renderingContext) {
        return new ScreenPropertiesRenderedNode(elementContext, renderingContext, _definitionFile);
    }
}
