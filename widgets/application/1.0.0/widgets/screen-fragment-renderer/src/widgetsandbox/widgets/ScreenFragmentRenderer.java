package widgetsandbox.widgets;

import java.util.Set;

import org.w3c.dom.Element;
import org.w3c.dom.Node;

import widgetsandbox.widgets.ScreenFragmentCompiler.FragmentCompilationResult;

import com.aviarc.core.dataset.Dataset;
import com.aviarc.core.dataset.DatasetRow;
import com.aviarc.core.diagnostics.ResourceCompilationInfo;
import com.aviarc.core.diagnostics.ResourceDiagnostic;
import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.screen.ScreenRequirementsCollector;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.DefaultRenderedNodeFactory;
import com.aviarc.framework.toronto.widget.DefaultRenderedWidgetImpl;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;

public class ScreenFragmentRenderer implements DefaultRenderedNodeFactory {
    private DefaultDefinitionFile _definition;
 
    /*
     * (non-Javadoc)
     * @see com.aviarc.framework.toronto.widget.DefaultRenderedNodeFactory#initialize(com.aviarc.framework.toronto.widget.DefaultDefinitionFile)
     */
    public void initialize(DefaultDefinitionFile definitionFile) {
        // Store the definition - our rendered node class requires it as it derives from DefaultRenderedNodeImpl
        this._definition = definitionFile;
    }
 
    /*
     * (non-Javadoc)
     * @see com.aviarc.framework.toronto.widget.RenderedNodeFactory#createRenderedNode(com.aviarc.framework.xml.compilation.ResolvedElementContext, com.aviarc.framework.toronto.screen.ScreenRenderingContext)
     */
    public RenderedNode createRenderedNode(ResolvedElementContext<CompiledWidget> elementContext,
                                           ScreenRenderingContext renderingContext) {
        String xml = elementContext.getAttribute("xml").getResolvedValue();
        
        String resultsDatasetName = elementContext.getAttribute("compile-results-dataset").getResolvedValue();
        
        Dataset resultsDataset = renderingContext.getCurrentState().getApplicationState().getDatasetStack().findDataset(resultsDatasetName);
        resultsDataset.deleteAllRows();
        
        
        ScreenFragmentCompiler compiler = new ScreenFragmentCompiler(renderingContext.getCurrentState().getAviarc(),
                                                                      renderingContext.getCurrentState().getCurrentApplication());
        
        FragmentCompilationResult compiledFragment = compiler.compileScreenFragment(xml);
        
        // Into a rendered node...
        ResourceCompilationInfo compileInfo = compiledFragment.getCompileInfo();
        CompiledWidget widget = compiledFragment.getCompiledWidget();
        
        RenderedNode ourNode = new ScreenFragmentRendererImpl(elementContext, 
                                                              renderingContext, 
                                                              _definition);
        
        DatasetRow dsRow;
        for (ResourceDiagnostic compileItem : compileInfo.getErrors()) {
            dsRow = resultsDataset.createRow();
            dsRow.setField("type", "error");
            dsRow.setField("message", compileItem.getMessage());
            dsRow.setField("position", compileItem.getPosition());
        }
        for (ResourceDiagnostic compileItem : compileInfo.getWarnings()) {
            dsRow = resultsDataset.createRow();
            dsRow.setField("type", "warning");
            dsRow.setField("message", compileItem.getMessage());
            dsRow.setField("position", compileItem.getPosition());
        }
        
        // widget might be null;
        if (widget != null) {
            RenderedNode node = widget.createRenderedNode(renderingContext);
            ourNode.addChild(node);
            
        }
        
        return ourNode;
    }
 
    /**
     * Our custom implementation of RenderedNode.
     * 
     * It derives from DefaultRenderedNodeImpl so that all the normal behaviour for widgets, e.g. javascript
     * constructors, requirements registering, required datasets etc are taken from the definition file.
     * 
     * We override the HTML generation method to provide our own markup.
     * 
     */
    public static class ScreenFragmentRendererImpl extends DefaultRenderedWidgetImpl {
        private FragmentCompilationResult _compiledFragment;

        public ScreenFragmentRendererImpl(ResolvedElementContext<CompiledWidget> resolvedContext,
                                            ScreenRenderingContext renderingContext, 
                                            DefaultDefinitionFile definition) {
            super(resolvedContext, renderingContext, definition);  
            
          
            
        }
 
        /**
         * Overridden to generate custom markup.
         */
        @Override
        public Node createXHTML(XHTMLCreationContext context) {
            // Use the current document to create an element
            Element div = context.getCurrentDocument().createElement("DIV");
            div.setAttribute("id", String.format("%1$s:container", getAttributeValue("name")));
            div.setAttribute("style", "background-color: Linen");
            
            // Render each child into the div
            for (RenderedNode childNode : this.getChildren()) {
                div.appendChild(childNode.createXHTML(context));
            }
            
            return div;
        }

        @Override
        public void registerRequirements(ScreenRequirementsCollector collector) {
            // TODO Auto-generated method stub
            super.registerRequirements(collector);
        }

        @Override
        public Set<String> getRequiredDatasets() {
            // TODO Auto-generated method stub
            return super.getRequiredDatasets();
        }
    }
}
