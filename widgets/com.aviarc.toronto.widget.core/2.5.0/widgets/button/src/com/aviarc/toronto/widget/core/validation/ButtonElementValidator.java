package com.aviarc.toronto.widget.core.validation;

import static com.aviarc.core.util.CollectionUtils.list;

import com.aviarc.framework.toronto.screen.CompiledWidget;
import com.aviarc.framework.toronto.widget.validation.AttributeMutualExclusionElementValidator;
import com.aviarc.framework.toronto.widget.validation.ContainerPositioningElementValidator;
import com.aviarc.framework.toronto.widget.validation.ElementValidator;
import com.aviarc.framework.xml.compilation.CompilationContext;
import com.aviarc.framework.xml.compilation.SubElement;

import java.util.List;

public class ButtonElementValidator implements ElementValidator {

    private static final List<ElementValidator> validators = list(
          new ContainerPositioningElementValidator(),
          new AttributeMutualExclusionElementValidator(0, 1, "enabled-if-dataset", "disabled-if-dataset"),
          new AttributeMutualExclusionElementValidator(0, 1, "visible-if-dataset", "invisible-if-dataset"));
    
    public void validate(SubElement<CompiledWidget> subElement, CompilationContext ctx) {
        for (ElementValidator validator : validators) {
            validator.validate(subElement, ctx);
        }
    }
    
}
