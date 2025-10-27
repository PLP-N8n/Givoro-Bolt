import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface TestResult {
  status: string;
  insert?: boolean;
  select?: boolean;
  cleanup?: boolean;
  recordId?: string;
  data?: any;
  error?: string;
  selectError?: string;
  cleanupError?: string;
  message?: string;
}

interface TestResults {
  timestamp: string;
  connection: {
    status: string;
    message: string;
    url?: string;
  };
  tables: {
    gift_suggestions?: TestResult;
    affiliate_clicks?: TestResult;
    saved_gifts?: TestResult;
    sessions?: TestResult;
    user_profiles?: TestResult;
  };
  summary?: {
    allPassed: boolean;
    message: string;
    tableResults: { [key: string]: boolean };
  };
}

async function testTable(
  supabase: any,
  tableName: string,
  testData: any
): Promise<TestResult> {
  try {
    const { data: insertData, error: insertError } = await supabase
      .from(tableName)
      .insert([testData])
      .select();

    if (insertError) {
      return {
        status: "error",
        insert: false,
        error: insertError.message,
      };
    }

    const result: TestResult = {
      status: "ok",
      insert: true,
      recordId: insertData?.[0]?.id,
    };

    if (insertData?.[0]?.id) {
      const { data: selectData, error: selectError } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", insertData[0].id)
        .single();

      if (selectError) {
        result.select = false;
        result.selectError = selectError.message;
      } else {
        result.select = true;
        result.data = selectData;
      }

      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq("id", insertData[0].id);

      if (deleteError) {
        result.cleanup = false;
        result.cleanupError = deleteError.message;
      } else {
        result.cleanup = true;
      }
    }

    return result;
  } catch (err: any) {
    return {
      status: "error",
      message: err.message,
    };
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  const results: TestResults = {
    timestamp: new Date().toISOString(),
    connection: { status: "unknown", message: "" },
    tables: {},
  };

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !supabaseServiceRole) {
      results.connection = {
        status: "failed",
        message:
          "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables",
      };

      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(results, null, 2),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    results.connection = {
      status: "connected",
      message: "Successfully created Supabase client",
      url: supabaseUrl.substring(0, 30) + "...",
    };

    const testId = `test-${Date.now()}`;

    results.tables.gift_suggestions = await testTable(
      supabase,
      "gift_suggestions",
      {
        query: testId,
        ai_response: { test: true, timestamp: new Date().toISOString() },
        session_id: testId,
      }
    );

    results.tables.affiliate_clicks = await testTable(
      supabase,
      "affiliate_clicks",
      {
        product_name: "Test Product " + testId,
        product_url: "https://amazon.co.uk/test-" + testId,
        affiliate_tag: "test-tag-21",
      }
    );

    results.tables.saved_gifts = await testTable(supabase, "saved_gifts", {
      session_id: testId,
      recipient_name: "Test Recipient",
      gift_title: "Test Gift " + testId,
      gift_reason: "Testing database connectivity",
      product_url: "https://amazon.co.uk/test-" + testId,
      occasion: "Testing",
      budget_range: "£20-50",
    });

    results.tables.sessions = await testTable(supabase, "sessions", {
      id: testId,
      user_agent: "Test Agent",
      ip_address: "127.0.0.1",
      completed_steps: ["step1", "step2"],
      converted: false,
    });

    results.tables.user_profiles = await testTable(supabase, "user_profiles", {
      email: `test-${testId}@example.com`,
      session_ids: [testId],
      favorite_recipients: [{ name: "Test", count: 1 }],
      typical_budget: "£20-50",
      interests: ["testing", "automation"],
      total_suggestions_viewed: 0,
      total_clicks: 0,
    });

    const tableResults: { [key: string]: boolean } = {};
    let allTestsPassed = true;

    for (const [tableName, result] of Object.entries(results.tables)) {
      const passed = result?.status === "ok";
      tableResults[tableName] = passed;
      if (!passed) {
        allTestsPassed = false;
      }
    }

    results.summary = {
      allPassed: allTestsPassed,
      message: allTestsPassed
        ? "All database tests passed successfully - All 5 tables working"
        : "Some database tests failed - check details above",
      tableResults,
    };

    return {
      statusCode: allTestsPassed ? 200 : 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(results, null, 2),
    };
  } catch (err: any) {
    results.connection = {
      status: "error",
      message: err.message,
    };

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(results, null, 2),
    };
  }
};
