package com.aviarc.toronto.widget.core;

import javax.xml.transform.Templates;

import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.util.JavascriptUtils;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.xslt.DefaultXSLTRenderedNodeImpl;
import com.aviarc.framework.toronto.widget.xslt.XSLTRenderedNodeFactory;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;

import com.aviarc.framework.toronto.widget.util.ValidationRenderedNodeHelper;

public class ButtonRenderedNodeFactory implements XSLTRenderedNodeFactory {

    private static final long serialVersionUID = 1L;
    public static class ButtonRenderedNode extends DefaultXSLTRenderedNodeImpl {

        public ButtonRenderedNode(final ResolvedElementContext<CompiledWidget> resolvedContext,
                                  final ScreenRenderingContext renderingContext,
                                  final DefaultDefinitionFile definition,
                                  final Templates widgetTemplate) {
            super(resolvedContext, renderingContext, definition, widgetTemplate);
        }

        @Override
        public String getJavascriptDeclaration() {
            String validationContext = ValidationRenderedNodeHelper.getValidationContext(this.getResolvedElementContext());
            return String.format("new YAHOO.com.aviarc.framework.toronto.widget.core.v2_5_0.Button(%s)", validationContext);
        }

    }

    private Templates _widgetTemplate;
    private DefaultDefinitionFile _definitionFile;

    public void initialize(DefaultDefinitionFile definitionFile, Templates widgetTemplate) {
        _widgetTemplate = widgetTemplate;
        _definitionFile = definitionFile;
    }

    public RenderedNode createRenderedNode(ResolvedElementContext<CompiledWidget> elementContext,
                                           ScreenRenderingContext renderingContext) {
        return new ButtonRenderedNode(elementContext, renderingContext,  _definitionFile, _widgetTemplate);
    }
}


