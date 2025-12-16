import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    console.log("Sending OTP to:", email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user exists
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = users?.users?.some(u => u.email === email);
    
    if (!userExists) {
      console.log("User not found:", email);
      return new Response(
        JSON.stringify({ error: "No account found with this email" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    console.log("Generated OTP for", email);

    // Delete any existing OTPs for this email
    await supabaseAdmin
      .from("password_reset_otps")
      .delete()
      .eq("email", email);

    // Store OTP in database
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_otps")
      .insert({
        email,
        otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      throw insertError;
    }

    // Send email with OTP
    const { error: emailError } = await resend.emails.send({
      from: "Part Time Paisa <onboarding@resend.dev>",
      to: [email],
      subject: "Password Reset OTP - Part Time Paisa",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">Part Time Paisa</h1>
          <h2>Password Reset Request</h2>
          <p>Your OTP for password reset is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
          </div>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            © Part Time Paisa - Your local job platform
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("OTP sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
