<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"
     
     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="check-box">

        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>
        <xsl:variable name="mandatory"><xsl:if test="xsltutils:isTrue(@mandatory)">mandatory</xsl:if></xsl:variable>
        <xsl:variable name="class"><xsl:value-of select="concat(@class, ' ', $mandatory)"/></xsl:variable>

        <xsl:variable name="invisible-style">
            <xsl:if test="xsltutils:isFalse(@visible)">display-none</xsl:if>
        </xsl:variable>

        <xsl:variable name="checked">
            <xsl:choose>
                <!--no current row-->
                <xsl:when test="not(xsltutils:getDatasetCurrentRow(xsltutils:getDatasetName(@selection-field)))">n</xsl:when>
                <!--our checked value-->
                <xsl:when test="xsltutils:getFieldValue(@selection-field) = @checked-value">y</xsl:when>
                <xsl:otherwise>n</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="enabled">
            <xsl:choose>
                <xsl:when test="xsltutils:getDatasetCurrentRow(xsltutils:getDatasetName(@selection-field)) and xsltutils:isTrue(@enabled)">y</xsl:when>
                <xsl:otherwise>n</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <div id="{@name}:div" title="{@tooltip}" class="{$invisible-style} {cssutils:makeClassString(concat($css-prefix, 'checkbox'), $class)}">
        	<div/> <!--  border element -->
			<div class="checkbox-outer">
				<div class="checkbox-inner">
				    <xsl:choose>
				        <xsl:when test="$checked = 'y' and $enabled = 'y'">
				            <input type="checkbox" id="{@name}:input" checked="true"></input>
				        </xsl:when>
				        <xsl:when test="$enabled = 'y'">
				            <input type="checkbox" id="{@name}:input"></input>
				        </xsl:when>
				        <xsl:when test="$checked = 'y'">
				            <input type="checkbox" id="{@name}:input" disabled="true" checked="true"></input>
				        </xsl:when>
				        <xsl:otherwise>
				            <input type="checkbox" id="{@name}:input" disabled="true"></input>
				        </xsl:otherwise>
				    </xsl:choose>
				</div>
				<xsl:variable name="mandatory-style">
            		<xsl:if test="xsltutils:isFalse(@mandatory)">display-none</xsl:if>
        		</xsl:variable>
                   
				<div id="{@name}:mandatory" class="checkbox-mandatory {$mandatory-style}" title="This field is mandatory.">				
					This field is mandatory.
				</div>
			</div>
        </div>
    </xsl:template>
 </xsl:stylesheet>
