function createJSONResponse(data: any, status = 200) {
  const ResponseClass = typeof Response !== 'undefined' ? Response : (globalThis as any).Response;
  return new ResponseClass(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(...args: any[]): Promise<Response> {
  console.log("--- POST CALLED ---");
  console.log("Number of arguments:", args.length);
  args.forEach((arg, index) => {
    console.log(`Arg ${index}:`, typeof arg, arg ? Object.keys(arg) : "null");
  });

  try {
    const request = args[0];
    if (!request) {
      throw new Error("First argument (Request) is undefined!");
    }

    let body: any = {};
    try {
      body = await request.json();
      console.log("Parsed body:", body);
    } catch (parseErr: any) {
      console.warn("Failed to parse request JSON body:", parseErr.message);
    }

    const { level, raw, email, pushToken, emailJsConfig, sourceLevel } = body;
    const targetLevel = sourceLevel !== undefined ? sourceLevel : level;

    const results: { email?: any; push?: any } = {};

    // 1. Push
    const targetPushToken = pushToken || process.env.EXPO_PUSH_TOKEN;
    if (targetPushToken) {
      try {
        const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: targetPushToken,
            sound: true,
            title: "Source tank critically low",
            body: `Source tank is at ${targetLevel ?? 0}%. Refill before the pump runs dry.`,
            data: {
              type: "source-low",
              sourceLevel: targetLevel ?? 0,
              sourceRaw: raw ?? targetLevel ?? 0,
              updatedAt: new Date().toISOString(),
            },
            channelId: "water-alerts",
            priority: "high",
          }),
        });

        const pushData = await pushResponse.json();
        if (!pushResponse.ok || pushData.data?.status === "error") {
          results.push = {
            success: false,
            error: pushData.data?.message || `Status ${pushResponse.status}`
          };
        } else {
          results.push = {
            success: true,
            message: "Push notification sent successfully."
          };
        }
      } catch (err: any) {
        results.push = {
          success: false,
          error: err.message
        };
      }
    }

    // 2. Email
    const targetEmail = email || process.env.ALERT_EMAIL || "sangmolama29@gmail.com";
    if (targetEmail) {
      const serviceId = emailJsConfig?.serviceId || process.env.EMAILJS_SERVICE_ID;
      const templateId = emailJsConfig?.templateId || process.env.EMAILJS_TEMPLATE_ID;
      const userId = emailJsConfig?.userId || process.env.EMAILJS_USER_ID;

      const subject = "⚠️ CRITICAL ALERT: Source Water Tank Level Low";
      const messageBody = `Smart Water Tank Monitor alert:\n\nThe Source Tank is critically low at ${targetLevel ?? 0}%. Please refill the tank or shut down the pump to prevent running dry.`;

      if (serviceId && templateId && userId) {
        try {
          const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              service_id: serviceId,
              template_id: templateId,
              user_id: userId,
              template_params: {
                to_email: targetEmail,
                subject: subject,
                message: messageBody,
              },
            }),
          });

          if (emailResponse.ok) {
            results.email = {
              success: true,
              message: `Email alert sent successfully to ${targetEmail} via EmailJS.`
            };
          } else {
            const errText = await emailResponse.text();
            results.email = {
              success: false,
              error: errText || `Status ${emailResponse.status}`
            };
          }
        } catch (err: any) {
          results.email = {
            success: false,
            error: err.message
          };
        }
      } else {
        const simulationMessage = `[SIMULATION] Email sent to ${targetEmail}\nSubject: ${subject}\nBody: ${messageBody}`;
        console.log(simulationMessage);
        results.email = {
          success: true,
          message: `(Simulated) Email alert sent to ${targetEmail}`
        };
      }
    }

    return createJSONResponse({
      success: true,
      message: "Alert request processed.",
      results
    });
  } catch (error: any) {
    console.error("API ROUTE ERROR:", error);
    return createJSONResponse({
      success: false,
      error: error.message || "Failed to process request"
    }, 400);
  }
}
