package cn.workde.core.base.validation.annotation;

import javax.validation.Constraint;
import javax.validation.Payload;
import javax.validation.constraints.NotNull;
import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * 验证是否为汉字
 * 只支持以下几种格式：
 * @author zhujingang
 * @date 2019/8/29 9:14 PM
 */
@Documented
@Retention(RUNTIME)
@Target({ METHOD, FIELD, ANNOTATION_TYPE, CONSTRUCTOR, PARAMETER, TYPE_USE })
@Constraint(validatedBy = { ChineseValidator.class })
public @interface Chinese {

	/**
	 * 是否不允许为空 {@linkplain NotNull}
	 * @return 默认：true
	 */
	boolean notNull() default true;

	String message() default "必须是中文汉字";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

}
