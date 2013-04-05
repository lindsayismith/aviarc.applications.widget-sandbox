package com.aviarc.toronto.widget.core;

import static java.lang.Integer.parseInt;

import org.w3c.dom.Element;
import org.w3c.dom.Node;

import com.aviarc.core.components.AviarcURN;
import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.screen.ScreenRequirementsCollector;
import com.aviarc.framework.toronto.screen.rendering.html.positioning.ContainerPositioningHelper;
import com.aviarc.framework.toronto.screen.rendering.html.positioning.DelegatingXHTMLCreationContext;
import com.aviarc.framework.toronto.util.CssUtils;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.DefaultRenderedNodeFactory;
import com.aviarc.framework.toronto.widget.DefaultRenderedWidgetImpl;
import com.aviarc.framework.util.BrowserDetection;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;

public class ScreenRenderedNodeFactory implements DefaultRenderedNodeFactory {
    private static final long serialVersionUID = 1L;
    public class ScreenRenderedNode extends DefaultRenderedWidgetImpl implements RenderedNode {

        private boolean _isIE6;
        public ScreenRenderedNode(final ResolvedElementContext<CompiledWidget> resolvedContext,
                                  final ScreenRenderingContext renderingContext, 
                                  final DefaultDefinitionFile definition) {
            super(resolvedContext, renderingContext, definition);  
            _isIE6 = BrowserDetection.isIE6(renderingContext.getCurrentState().getRequestState());
        }

        private static final String EMPTY_STRING = "";
        private boolean isNull(String in) {
            return in == null || in.equals(EMPTY_STRING);
        }    
        
        private String makeClass(String component, String customClasses) {
            return CssUtils.makeClassString(String.format("%sscreen-%s", this.getDefinitionFile().getCssPrefix(),
                                            component),
                                            customClasses);
        }
        
        @Override
        public void registerRequirements(ScreenRequirementsCollector collector) {
            super.registerRequirements(collector);
            
            String title = this.getAttributeValue("title");
            collector.requestPageTitle(title);
            
            String bodyClass = String.format("%sscreen", this.getDefinitionFile().getCssPrefix());
            collector.requestBodyClass(bodyClass);
            
            /* TODO: this is only needed because we still use the old-style WidgetSearch mechanism for these.
             *       Change to do the searching / override resolution here instead and use the unique URN in the URN,
             *       and remove the applicationName parameter too.
             */
            AviarcURN widgetURN = this.getDefinitionFile().getWidgetURN();
            AviarcURN nonUniqueURN = widgetURN.builder()
                                            .sharedComponent(false).applicationID(null)
                                            .applicationName(null).build();
            collector.requestFavIcon(getResolvedElementContext().getApplicationName(), nonUniqueURN, "favicon.ico");
        }

        @Override
        public Node createXHTML(XHTMLCreationContext context) {
            
            final String left = this.getAttributeValue("left");
            final String right = this.getAttributeValue("right");
            final String top = this.getAttributeValue("top");
            final String bottom = this.getAttributeValue("bottom");
            final String width = this.getAttributeValue("width");
            final String height = this.getAttributeValue("height");
            final String minWidth = this.getAttributeValue("min-width");
            final String minHeight = this.getAttributeValue("min-height");
            final String maxWidth = this.getAttributeValue("max-width");
            final String maxHeight = this.getAttributeValue("max-height");
            
            final int finalLeft = isNull(left) ? 0 : parseInt(left);
            final int finalRight = isNull(right) ? 0 : parseInt(right);
            final int finalTop = isNull(top) ? 0 : parseInt(top);
            final int finalBottom = isNull(bottom) ? 0 : parseInt(bottom);

            final String contentStyle = getContentStyle(finalLeft, finalRight, finalTop, finalBottom);
            final String borderStyle = getBorderStyle(height, minHeight, maxHeight, finalTop, finalBottom);
            final String horizontalStyle = getHorizontalStyle(width, minWidth, maxWidth, finalLeft, finalRight);

            return createScreenContainer(context, contentStyle, borderStyle, horizontalStyle);
        }

        private Element createScreenContainer(XHTMLCreationContext context, final String contentStyle,
                final String borderStyle, final String horizontalStyle) {
            /*
              <div class="screen-container">
               <div class="screen-horizontal style="{$final-horizontal-style}">
                <div class="screen-border" style="{$final-border-style}">
                 <div id="{@name}:div" class="screen-content" style="{$final-content-style}">
                  Screen content
                 </div>
                </div>
               </div>
               <div id="{@name}:timer-container" class="timer2-container display-none"></div>
               <div id="{@name}:timer" class="screen-timer2 display-none invisible"></div>
              </div>
            */
            final String name = this.getAttributeValue("name");
            final String customClasses = this.hasAttribute("class") ? this.getAttributeValue("class") : EMPTY_STRING;

            Element screenContainer = context.getCurrentDocument().createElement("div");
            screenContainer.setAttribute("id", name + ":container");
            screenContainer.setAttribute("class", makeClass("container", customClasses));
            screenContainer.setAttribute("style", "position:absolute !important;");
            
            Element screenHorizontal = context.getCurrentDocument().createElement("div");
            screenHorizontal.setAttribute("class", makeClass("horizontal", customClasses));
            screenHorizontal.setAttribute("style", horizontalStyle);
            screenContainer.appendChild(screenHorizontal);
                    
            Element screenBorder = context.getCurrentDocument().createElement("div");
            screenBorder.setAttribute("class", makeClass("border", customClasses));
            screenBorder.setAttribute("style", borderStyle);
            screenHorizontal.appendChild(screenBorder);
            
            Element screenContent = context.getCurrentDocument().createElement("div");
            screenContent.setAttribute("id", String.format("%s:div", name));
            screenContent.setAttribute("class", makeClass("content", customClasses));
            screenContent.setAttribute("style", contentStyle);
            screenBorder.appendChild(screenContent);
            
            Element timerContainer = context.getCurrentDocument().createElement("div");
            timerContainer.setAttribute("id", String.format("%s:timer-container", name));
            timerContainer.setAttribute("class", "timer-container display-none");
            timerContainer.setAttribute("style", "position:absolute !important;");
            screenContainer.appendChild(timerContainer);
            
            Element timer = context.getCurrentDocument().createElement("div");
            timer.setAttribute("id", String.format("%s:timer", name));
            timer.setAttribute("class", "screen-timer display-none invisible");
            timer.setAttribute("style", "position:absolute !important;");
            screenContainer.appendChild(timer);
            
            Node child;
            String positioningType = getAttributeDefault("position", "absolute");
            String positioningUnit = getAttributeDefault("unit", "px");
            ContainerPositioningHelper newPositioningHelper = new ContainerPositioningHelper(positioningType, positioningUnit);
            DelegatingXHTMLCreationContext newContext = new DelegatingXHTMLCreationContext(context, newPositioningHelper);
            for (RenderedNode node : this.getChildren()) {
                child = node.createXHTML(newContext);
                if (child != null) {
                    screenContent.appendChild(child);
                }
            }
            return screenContainer;
        }
        
        private String getAttributeDefault(String attributeName, String defaultValue) {
            String widgetDefault = this.getAttributeValue(attributeName + "-default");
            if (widgetDefault != null) {
                return widgetDefault;
            }
//            String appDefault = getScreenRenderingContext().getCurrentState().getCurrentApplicationInstance().getVariableManager()
//                    .getVariable(attributeName);
//            if (appDefault != null) {
//                return appDefault;
//            }
            String widgetVariable = this.getAttributeValue(attributeName);
            if (widgetVariable != null) {
                return widgetVariable;
            }
            return defaultValue;
        }

        private String getHorizontalStyle(final String width, final String minWidth, final String maxWidth,
                final int finalLeft, final int finalRight) {
            /*
               horizontal div takes care of the width
               if we have a height specified, then we use it, otherwise we need top and bottom.
               add max-height/min-height if we have them; 
        
               fixed width:
               width: 400px; <- has to include left and right
        
               flowing width:
               width: expression(this.parentElement.offsetWidth);
        
               max-width:
               width: expression(Math.min(this.parentElement.offsetWidth, @max-width + @left + @right));
        
               min-width:
               width: expression(Math.max(this.parentElement.offsetWidth, @min-width + @left + @right));
        
               both:
               width: expression(Math.min(Math.max(this.parentElement.offsetWidth, @min-width + etc), @max-width + etc));
             */
            final boolean nullWidth = isNull(width);
            final boolean nullMinWidth = isNull(minWidth);
            final boolean nullMaxWidth = isNull(maxWidth);
            final String horizontalWidth = nullWidth
                    ? EMPTY_STRING
                    : String.format("width:%dpx;", (parseInt(width) + finalLeft + finalRight));
            final String horizontalIe6WidthBase = nullWidth ? "document.body.clientWidth" : EMPTY_STRING;
            final String horizontalIe6WidthMinWidth = (nullWidth && !nullMinWidth)
                    ? String.format("Math.max(%s, %s)",
                                    isNull(horizontalIe6WidthBase) ? "''" : horizontalIe6WidthBase,
                                    (parseInt(minWidth) + finalLeft + finalRight))
                    : horizontalIe6WidthBase;
            final String horizontalIe6WidthMaxWidth = (nullWidth && !nullMaxWidth)
                    ? String.format("Math.min(%s, %s)",
                                    isNull(horizontalIe6WidthMinWidth) ? "''" : horizontalIe6WidthMinWidth,
                                    (parseInt(maxWidth) + finalLeft + finalRight))
                    : horizontalIe6WidthMinWidth;
            final String horizontalIe6Width = isNull(horizontalIe6WidthMaxWidth)
                    ? EMPTY_STRING : String.format("width:expression(%s);", horizontalIe6WidthMaxWidth);
            final String horizontalMinWidth = nullMinWidth
                    ? EMPTY_STRING : String.format("min-width:%dpx;", (parseInt(minWidth) + finalLeft + finalRight));
            final String horizontalMaxWidth = nullMaxWidth
                    ? EMPTY_STRING : String.format("max-width:%dpx;", (parseInt(maxWidth) + finalLeft + finalRight));
            
            return String.format("position:relative !important; %s %s %s %s",
                    horizontalWidth, 
                    _isIE6 ? horizontalIe6Width : "", 
                    horizontalMinWidth, 
                    horizontalMaxWidth);
        }

        private String getBorderStyle(final String height, final String minHeight, final String maxHeight,
                final int finalTop, final int finalBottom) {
            /*
               border div takes care of the height 
               if we have a height specified, then we use it, otherwise we need top and bottom.
               add max-height/min-height if we have them; 
        
               fixed height:
               height: 400px; <- has to include left and right
        
               flowing height:
               height: expression(this.parentElement.offsetHeight);
        
               max-height:
               height: expression(Math.min(this.parentElement.offsetHeight, @max-height));
        
               min-height:
               height: expression(Math.max(this.parentElement.offsetHeight, @min-height));
        
               both:
               height: expression(Math.min(Math.max(this.parentElement.offsetHeight, @min-height), @max-height)); 
             */
            final boolean nullHeight = isNull(height);
            final boolean nullMinHeight = isNull(minHeight);
            final boolean nullMaxHeight = isNull(maxHeight);    
            final String borderHeight = nullHeight
                    ? EMPTY_STRING
                    : String.format("height:%dpx; ", (parseInt(height) + finalTop + finalBottom));
            final String borderIe6HeightBase = nullHeight ? "this.parentElement.offsetHeight" : EMPTY_STRING;
            final String borderIe6HeightMinWidth = (nullHeight && !nullMinHeight)
                    ? String.format("Math.max(%s, %s)",
                            borderIe6HeightBase, (parseInt(minHeight) + finalTop + finalBottom))
                    : borderIe6HeightBase;
            final String borderIe6HeightMaxWidth = (nullHeight && !nullMaxHeight)
                    ? String.format("Math.min(%s, %s)",
                            borderIe6HeightMinWidth, (parseInt(maxHeight) + finalTop + finalBottom))
                    : borderIe6HeightMinWidth;
            
            final String borderIe6Height = isNull(borderIe6HeightMaxWidth)
                    ? EMPTY_STRING : String.format("height:expression(%s);", borderIe6HeightMaxWidth);
            final String borderMinHeight = nullMinHeight
                    ? EMPTY_STRING : String.format("min-height:%dpx;", (parseInt(minHeight) + finalTop + finalBottom));
            final String borderMaxHeight = nullMaxHeight
                    ? EMPTY_STRING : String.format("max-height:%dpx;", (parseInt(maxHeight) + finalTop + finalBottom));
            
            return String.format("position:absolute !important; %s %s %s %s",
                    borderHeight, 
                    _isIE6 ? borderIe6Height : "", 
                    borderMinHeight, 
                    borderMaxHeight);
        }

        private String getContentStyle(final int finalLeft, final int finalRight, final int finalTop,
                final int finalBottom) {
            // The content div just has the left/right/top/bottom which therefore needs the ie6 height and width            
            final String contentIe6Width = _isIE6
                    ? String.format("width:expression(this.parentElement.offsetWidth - %d);", (finalLeft + finalRight))
                    : EMPTY_STRING;
            
            final String contentIe6Height = _isIE6
                    ? String.format("height:expression(this.parentElement.offsetHeight - %d);", (finalTop + finalBottom))
                    : EMPTY_STRING;
            
            return String.format(
                    "position:absolute !important; left:%dpx; %s right:%dpx; top:%dpx; %s bottom:%dpx;",
                    finalLeft, contentIe6Width, finalRight,
                    finalTop, contentIe6Height, finalBottom);
        }                
    }

    private DefaultDefinitionFile _definitionFile;

    public void initialize(DefaultDefinitionFile definitionFile) {
        _definitionFile = definitionFile;
    }

    public RenderedNode createRenderedNode(ResolvedElementContext<CompiledWidget> elementContext,
                                           ScreenRenderingContext renderingContext) {
        return new ScreenRenderedNode(elementContext, renderingContext, _definitionFile);
    }

}
