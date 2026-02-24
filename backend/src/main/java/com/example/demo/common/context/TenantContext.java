package com.example.demo.common.context;

public class TenantContext {

    private static final Long TENANT_TEST_ID = 1L;

    public static Long getTenantId() {
        return TENANT_TEST_ID;
    }

	public static void setTenantId(long l) {
		// TODO Auto-generated method stub
		
	}
}