import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    connection: { status: "unknown", message: "" },
    tables: {},
    testOperations: {},
  };

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !supabaseServiceRole) {
      results.connection = {
        status: "failed",
        message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables",
      };

      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(results),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    results.connection = {
      status: "connected",
      message: "Successfully created Supabase client",
      url: supabaseUrl.substring(0, 30) + "...",
    };

    const testId = `test-${Date.now()}`;

    try {
      const { data: insertData, error: insertError } = await supabase
        .from("gift_suggestions")
        .insert([
          {
            query: testId,
            ai_response: { test: true, timestamp: new Date().toISOString() },
          },
        ])
        .select();

      if (insertError) {
        results.tables.gift_suggestions = {
          status: "error",
          insert: false,
          error: insertError.message,
        };
      } else {
        results.tables.gift_suggestions = {
          status: "ok",
          insert: true,
          recordId: insertData?.[0]?.id,
        };

        if (insertData?.[0]?.id) {
          const { data: selectData, error: selectError } = await supabase
            .from("gift_suggestions")
            .select("*")
            .eq("id", insertData[0].id)
            .single();

          if (selectError) {
            results.tables.gift_suggestions.select = false;
            results.tables.gift_suggestions.selectError = selectError.message;
          } else {
            results.tables.gift_suggestions.select = true;
            results.tables.gift_suggestions.data = selectData;
          }

          const { error: deleteError } = await supabase
            .from("gift_suggestions")
            .delete()
            .eq("id", insertData[0].id);

          if (deleteError) {
            results.tables.gift_suggestions.cleanup = false;
            results.tables.gift_suggestions.cleanupError = deleteError.message;
          } else {
            results.tables.gift_suggestions.cleanup = true;
          }
        }
      }
    } catch (err: any) {
      results.tables.gift_suggestions = {
        status: "error",
        message: err.message,
      };
    }

    try {
      const { data: insertData, error: insertError } = await supabase
        .from("affiliate_clicks")
        .insert([
          {
            product_name: "Test Product " + testId,
            product_url: "https://amazon.co.uk/test-" + testId,
            affiliate_tag: "test-tag-21",
          },
        ])
        .select();

      if (insertError) {
        results.tables.affiliate_clicks = {
          status: "error",
          insert: false,
          error: insertError.message,
        };
      } else {
        results.tables.affiliate_clicks = {
          status: "ok",
          insert: true,
          recordId: insertData?.[0]?.id,
        };

        if (insertData?.[0]?.id) {
          const { data: selectData, error: selectError } = await supabase
            .from("affiliate_clicks")
            .select("*")
            .eq("id", insertData[0].id)
            .single();

          if (selectError) {
            results.tables.affiliate_clicks.select = false;
            results.tables.affiliate_clicks.selectError = selectError.message;
          } else {
            results.tables.affiliate_clicks.select = true;
            results.tables.affiliate_clicks.data = selectData;
          }

          const { error: deleteError } = await supabase
            .from("affiliate_clicks")
            .delete()
            .eq("id", insertData[0].id);

          if (deleteError) {
            results.tables.affiliate_clicks.cleanup = false;
            results.tables.affiliate_clicks.cleanupError = deleteError.message;
          } else {
            results.tables.affiliate_clicks.cleanup = true;
          }
        }
      }
    } catch (err: any) {
      results.tables.affiliate_clicks = {
        status: "error",
        message: err.message,
      };
    }

    const allTestsPassed =
      results.tables.gift_suggestions?.status === "ok" &&
      results.tables.affiliate_clicks?.status === "ok";

    results.summary = {
      allPassed: allTestsPassed,
      message: allTestsPassed
        ? "All database tests passed successfully"
        : "Some database tests failed - check details above",
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
