package com.aviarc.toronto.widget.core;

import java.util.List;

import com.aviarc.core.InterfaceQuery;
import com.aviarc.core.UnsupportedInterfaceException;
import com.aviarc.core.dataset.CommitAwareDatasetRow;
import com.aviarc.core.dataset.Dataset;
import com.aviarc.core.dataset.DatasetRow;
import com.aviarc.core.dataset.unbound.UnboundDataset;
import com.aviarc.core.state.State;
import com.aviarc.core.util.RandomID;
import com.aviarc.framework.dataset.unbound.view.impl.UnboundDatasetFixedCurrentRow;
import com.aviarc.framework.toronto.datacontext.DatasetShadowingDataContextNode;
import com.aviarc.framework.toronto.datacontext.DatasetShadowingRenderingContext;
import com.aviarc.framework.toronto.datacontext.DatasetShadowingState;
import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.screen.RenderedNode;
import com.aviarc.framework.toronto.screen.ScreenRenderingContext;
import com.aviarc.framework.toronto.widget.DefaultDefinitionFile;
import com.aviarc.framework.toronto.widget.DefaultNameManagerImpl;
import com.aviarc.framework.toronto.widget.DefaultRenderedNodeFactory;
import com.aviarc.framework.xml.compilation.ResolvedElementContext;

public class RepeaterFactory implements DefaultRenderedNodeFactory {
    private static final long serialVersionUID = 0L;

    private DefaultDefinitionFile _definitionFile;

    public RenderedNode createRenderedNode(ResolvedElementContext<CompiledWidget> elementContext,
                                           ScreenRenderingContext renderingContext) {

        String datasetName  = elementContext.getAttribute("dataset").getResolvedValue();
        Dataset dataset = renderingContext.getCurrentState().getApplicationState().getDatasetStack().findDataset(datasetName);
        
        RepeaterRenderedNodeImpl renderedNode = new RepeaterRenderedNodeImpl(elementContext, renderingContext, _definitionFile);

        int currentRowIndex = 0;
        for (DatasetRow row : dataset.getAllRows()) {
            boolean skipRow = false;
            try {
                CommitAwareDatasetRow caRow = InterfaceQuery.queryInterface(row, CommitAwareDatasetRow.class);
                if (caRow.isMarkedDeleted()) {
                    skipRow = true; // ignore rows marked deleted
                }
            } catch (UnsupportedInterfaceException e) {
                // ignore if it doesn't have a commit action
            }

            if (!skipRow) {
                
                DatasetShadowingState repeaterState = new DatasetShadowingState(renderingContext.getCurrentState());
                
                // Create the shadowing datasets
                createRepeaterScopeDatasets(repeaterState, datasetName, currentRowIndex);

                
                DatasetShadowingRenderingContext repeaterRenderingContext = new DatasetShadowingRenderingContext(repeaterState, 
                                                                                                         new DefaultNameManagerImpl("repeater-" + RandomID.getShortRandomID()),
                                                                                                         renderingContext.getNextKID(),
                                                                                                         renderingContext.isEmbeddedScreen(),
                                                                                                         renderingContext.getContainingScreenName());
                
                DatasetShadowingDataContextNode repeaterDataContextNode = 
                        new DatasetShadowingDataContextNode(repeaterRenderingContext,
                                                            RandomID.getShortRandomID());
                
                repeaterDataContextNode.addChildRenderedNodes(elementContext, repeaterRenderingContext);
                renderedNode.addChild(repeaterDataContextNode);
               
            }
            currentRowIndex++;
        }

        return renderedNode;
    }
    
    
    private void createRepeaterScopeDatasets(DatasetShadowingState state, 
                                             String datasetName, 
                                             int currentRowIndex) {
        Dataset delegateDataset = state.getApplicationState().getDatasetStack().findDataset(datasetName);        
        UnboundDataset delegateUnbound = delegateDataset.getUnboundDataset();
        
        // The fixed current row dataset
        UnboundDatasetFixedCurrentRow repeaterScopeUnbound = new UnboundDatasetFixedCurrentRow(delegateUnbound.getName(),
                                                                                               delegateUnbound, 
                                                                                               currentRowIndex);
                                
        Dataset repeaterScopeDataset = repeaterScopeUnbound.makeDataset(state); 
        
        // create all required views as well
        List<Dataset> newProxyViews = UnboundDatasetFixedCurrentRow.createProxyChildViews(repeaterScopeDataset, state);
              
        // Add them to the shadowing state
        state.addShadowingDataset(repeaterScopeDataset);        
        for (Dataset proxyView : newProxyViews) {
            state.addShadowingDataset(proxyView);
        }
    }

    public void initialize(DefaultDefinitionFile definitionFile) {
        _definitionFile = definitionFile;
    }
}
