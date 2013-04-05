package com.aviarc.toronto.widget.core;

import javax.xml.transform.Templates;

import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.screen.ScreenRequirementsCollector;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.xslt.DefaultXSLTRenderedNodeImpl;
import com.aviarc.framework.toronto.widget.xslt.XSLTRenderedNodeFactory;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;


public class FileUploadNodeFactory implements XSLTRenderedNodeFactory {
    private static final long serialVersionUID = 1L;
    public class FileUploadNode extends DefaultXSLTRenderedNodeImpl {
        private final String _name;
        private final String _originalField;
        private final String _tempField;

        public FileUploadNode(final ResolvedElementContext<CompiledWidget> resolvedContext,
                              final ScreenRenderingContext renderingContext, 
                              final DefaultDefinitionFile definition,
                              final Templates widgetTemplate) {
            super(resolvedContext, renderingContext, definition, widgetTemplate);

            _name = resolvedContext.getAttribute("name").getResolvedValue();
            _originalField = resolvedContext.getAttribute("original-field").getResolvedValue();
            _tempField = resolvedContext.getAttribute("temp-field").getResolvedValue();
        }

        @Override
        public void registerRequirements(ScreenRequirementsCollector collector) {
            super.registerRequirements(collector);

            collector.registerFileUploadMapping(_name, _originalField, _tempField);
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
        return new FileUploadNode(elementContext, renderingContext,  _definitionFile, _widgetTemplate);
    }
}
