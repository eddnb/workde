package cn.workde.core.admin.module.logic;


/**
 * @author zhujingang
 * @date 2019/9/2 12:59 PM
 */
public interface IModuleLogic<T> {


	boolean beforeInsert(T updated);
	boolean afterInsert(T inserted);

	boolean beforeUpdate(T updated);
	boolean afterUpdate(T updated);

	boolean beforeDelete(T deleted);
	boolean afterDelete(T deleted);

	T getNewDefultValue();

}
