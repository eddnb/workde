package cn.workde.core.admin.web.annotation;


import java.lang.annotation.*;

/**
 * @author zhujingang
 * @date 2019/9/8 3:19 PM
 */
@Inherited
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD})
public @interface FieldDefine {

	String label();		//列表名称

	String width() default "10%";

	String listType() default "";

	/**
	 * table 自定义列模板
	 * @return
	 */
	String listTemplet() default "";

	boolean listEnable() default true;		//列表是否显示该字段

	boolean newEnabel() default true;		//新建时是否显示该字段

	boolean edtEnable() default true;		//修改时是否显示该字段

	// 是否必填
	boolean required() default false;

	// 提示
	String help() default "";

	int group() default 1;

	int order() default 100; //越小在越前面

}
