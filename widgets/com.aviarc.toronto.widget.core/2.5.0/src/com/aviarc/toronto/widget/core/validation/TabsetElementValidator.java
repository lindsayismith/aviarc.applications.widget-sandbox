package com.aviarc.toronto.widget.core.validation;

import static com.aviarc.core.util.CollectionUtils.list;

import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.widget.validation.AllowedChildElementsElementValidator;
import com.aviarc.framework.toronto.widget.validation.AttributeMutualExclusionElementValidator;
import com.aviarc.framework.toronto.widget.validation.ContainerPositioningElementValidator;
import com.aviarc.framework.toronto.widget.validation.ElementValidator;
import com.aviarc.framework.xml.compilation.CompilationContext;
import com.aviarc.framework.xml.compilation.SubElement;

import java.util.List;

public class TabsetElementValidator implements ElementValidator {
    
    private static final List<? extends ElementValidator> VALIDATORS = list(
          new ContainerPositioningElementValidator(),
          
          // Conflicting attributes - initial tab should be set from field or fixed value, but not both 
          new AttributeMutualExclusionElementValidator(0, 1, "active-tab-field", "current-tab-index"),
          
          // Only these children make sense
          new AllowedChildElementsElementValidator("tab", "when")
    );
    
    public void validate(SubElement<CompiledWidget> subElement, CompilationContext ctx) {
        for (ElementValidator validator : VALIDATORS) {
            validator.validate(subElement, ctx);
        }
    }
    
}
