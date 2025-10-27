import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import {
  createSession,
  updateSession,
  markSessionConverted,
  getOrCreateUserProfile,
  addSessionToProfile,
  incrementProfileStats,
  updateProfileInterests,
  trackRecipient,
} from "../../lib/session-helpers";

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
    tests: {},
  };

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !supabaseServiceRole) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing required environment variables",
        }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    const testEmail = `test-${Date.now()}@example.com`;

    results.tests.createSession = await (async () => {
      const { data, error } = await createSession(supabase, {
        user_agent: "Test Agent",
        ip_address: "127.0.0.1",
        utm_source: "test",
      });

      if (error) {
        return { success: false, error: error.message };
      }

      results.sessionId = data?.id;
      return { success: true, sessionId: data?.id };
    })();

    if (results.sessionId) {
      results.tests.updateSession = await (async () => {
        const { data, error } = await updateSession(
          supabase,
          results.sessionId,
          {
            completed_steps: ["step1", "step2"],
          }
        );

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, steps: data?.completed_steps };
      })();

      results.tests.markConverted = await (async () => {
        const { success, error } = await markSessionConverted(
          supabase,
          results.sessionId
        );

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      })();
    }

    results.tests.createProfile = await (async () => {
      const { data, error } = await getOrCreateUserProfile(
        supabase,
        testEmail
      );

      if (error) {
        return { success: false, error: error.message };
      }

      results.profileId = data?.id;
      return { success: true, profileId: data?.id };
    })();

    if (results.profileId && results.sessionId) {
      results.tests.addSessionToProfile = await (async () => {
        const { success, error } = await addSessionToProfile(
          supabase,
          results.profileId,
          results.sessionId
        );

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      })();

      results.tests.incrementStats = await (async () => {
        const { success, error } = await incrementProfileStats(
          supabase,
          results.profileId,
          "suggestions"
        );

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      })();

      results.tests.updateInterests = await (async () => {
        const { success, error } = await updateProfileInterests(
          supabase,
          results.profileId,
          ["tech", "gadgets"]
        );

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      })();

      results.tests.trackRecipient = await (async () => {
        const { success, error } = await trackRecipient(
          supabase,
          results.profileId,
          "Partner"
        );

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      })();
    }

    if (results.sessionId) {
      await supabase.from("sessions").delete().eq("id", results.sessionId);
    }

    if (results.profileId) {
      await supabase.from("user_profiles").delete().eq("id", results.profileId);
    }

    const allPassed = Object.values(results.tests).every(
      (test: any) => test.success
    );

    results.summary = {
      allPassed,
      totalTests: Object.keys(results.tests).length,
      message: allPassed
        ? "All session and profile helper tests passed"
        : "Some tests failed - check details above",
    };

    return {
      statusCode: allPassed ? 200 : 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(results, null, 2),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: err.message,
        stack: err.stack,
      }),
    };
  }
};
