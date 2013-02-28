package widgetsandbox.widgets;

import com.aviarc.core.Aviarc;
import com.aviarc.core.application.Application;
import com.aviarc.core.components.AviarcURN;
import com.aviarc.core.configuration.Properties;
import com.aviarc.core.configuration.PropertyOverrideResolver;
import com.aviarc.core.diagnostics.ResourceCompilationInfo;
import com.aviarc.core.diagnostics.ResourceDiagnostic.ResourceType;
import com.aviarc.core.diagnostics.SimpleResourceDiagnostic;
import com.aviarc.core.exceptions.AviarcRuntimeException;
import com.aviarc.core.exceptions.NoSuchPropertyException;
import com.aviarc.framework.diagnostics.ResourceCompilationResult;
import com.aviarc.framework.diagnostics.ResourceCompilationResult.ResourceCompilationInfoHasErrors;
import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.ScreenCompilationElementFactoryImpl;
import com.aviarc.framework.xml.compilation.AviarcXMLResourceCompilationException;
import com.aviarc.framework.xml.compilation.AviarcXMLResourceCompiler;
import com.aviarc.framework.xml.compilation.ElementFactory;

public class ScreenFragmentCompiler {
    private Aviarc _aviarc;
    private Application _application;

    public ScreenFragmentCompiler(Aviarc aviarc, Application application) {
        _aviarc = aviarc;
        _application = application;
    }
    
    public static class FragmentCompilationResult {
        private CompiledWidget _compiledWidget;
        private ResourceCompilationInfo _compileInfo;

        public FragmentCompilationResult(CompiledWidget compiledWidget,
                                         ResourceCompilationInfo compileInfo) {
            _compiledWidget = compiledWidget;
            _compileInfo = compileInfo;
        }

        public CompiledWidget getCompiledWidget() {
            return _compiledWidget;
        }

        public ResourceCompilationInfo getCompileInfo() {
            return _compileInfo;
        }
    }
    
    public FragmentCompilationResult compileScreenFragment(String fragment) {
        ResourceCompilationInfo compileInfo = new ResourceCompilationInfo();

        String defaultURNValue;
        try {
            defaultURNValue = PropertyOverrideResolver.resolveRequiredProperty(Properties.DEFAULT_WIDGET_URN, _application,
                                                                               _application.getAviarc());
        } catch (NoSuchPropertyException e) {
            compileInfo.add(new SimpleResourceDiagnostic(ResourceType.SCREEN, "*fragment*", null, e.toString(), true));
            return new FragmentCompilationResult(null, compileInfo);
        }

        AviarcURN defaultURN = AviarcURN.valueOf(defaultURNValue);

        ElementFactory<CompiledWidget> widgetElementFactory = new ScreenCompilationElementFactoryImpl(_aviarc, _application, defaultURN);

        // Use the xml resource compiler
        AviarcXMLResourceCompiler<CompiledWidget> compiler = new AviarcXMLResourceCompiler<CompiledWidget>(_application,
                widgetElementFactory, "screen", ResourceType.WIDGET);

        ResourceCompilationResult<CompiledWidget> compilationResult;
        try {
            compilationResult = compiler.compile(fragment, "*fragment*");
            CompiledWidget rootWidgetNode = compilationResult.addTo(compileInfo);
            return new FragmentCompilationResult(rootWidgetNode, compileInfo);
            
        } catch (AviarcXMLResourceCompilationException e) {
            compileInfo.add(new SimpleResourceDiagnostic(ResourceType.SCREEN, "*fragment*", null,
                                                         "Error while compiling screen: " + e.getCause().getMessage(), true));
            return new FragmentCompilationResult(null, compileInfo);
        } catch (ResourceCompilationInfoHasErrors e) {
            return new FragmentCompilationResult(null, compileInfo);
        } catch (Throwable t) { // SUPPRESS CHECKSTYLE IllegalCatch
            // Catch-all.  I'm catching throwable here as widgets may use reflection to instantiate instances which
            // opens us up to linkage errors or who knows what

            String message = String.format("Unexpected error while compiling screen: %s: %s",
                                            t.getClass().getName(),
                                            t.getMessage());
            

            compileInfo.add(new SimpleResourceDiagnostic(ResourceType.SCREEN,
                                                         "*fragment*",
                                                         null,
                                                         message,
                                                         true));
            return new FragmentCompilationResult(null, compileInfo);
        }

    }

    public CompiledWidget createWidget(String widgetXML, String docName, String docType) throws ResourceCompilationInfoHasErrors {
        ResourceCompilationInfo compileInfo = new ResourceCompilationInfo();

        String defaultURNValue;
        try {
            defaultURNValue = PropertyOverrideResolver.resolveRequiredProperty(Properties.DEFAULT_WIDGET_URN, _application,
                                                                               _application.getAviarc());
        } catch (NoSuchPropertyException e) {
            throw new AviarcRuntimeException("couldn't resolve DEFAULT_WIDGET_URN", e);
        }

        AviarcURN defaultURN = AviarcURN.valueOf(defaultURNValue);

        ElementFactory<CompiledWidget> widgetElementFactory = new ScreenCompilationElementFactoryImpl(_aviarc, _application, defaultURN);

        // Use the xml resource compiler
        AviarcXMLResourceCompiler<CompiledWidget> compiler = new AviarcXMLResourceCompiler<CompiledWidget>(_application,
                widgetElementFactory, docType, ResourceType.WIDGET);
        try {
            ResourceCompilationResult<CompiledWidget> compile = compiler.compile(widgetXML, docName);
            return compile.addTo(compileInfo);
        } catch (AviarcXMLResourceCompilationException e) {
            throw new AviarcRuntimeException("Error compiling widget: '" + widgetXML + "'", e);
        } 
    }
    
    
}
