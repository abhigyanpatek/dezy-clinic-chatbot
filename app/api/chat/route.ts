import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '@/lib/llm-config';
import { DOCTORS, generateTimeSlots } from '@/lib/constants';

type ToolFunctionCall = {
  function: { name: string; arguments: string };
};

type Appointment = {
  id: string;
  patientName: string;
  patientAge: number;
  patientPhone: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
};

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  timeout: 90_000
});

export async function POST(request: NextRequest) {
  try {
    const { messages, appointments } = await request.json();

    const functions = [
      {
        name: 'bookAppointment',
        description: 'Book a new appointment with a doctor',
        parameters: {
          type: 'object',
          properties: {
            patientName: { 
              type: 'string',
              description: 'Full name of the patient'
            },
            patientAge: { 
              type: 'number',
              description: 'Age of the patient'
            },
            patientPhone: { 
              type: 'string',
              description: 'Contact phone number'
            },
            doctorId: { 
              type: 'string',
              enum: ['dr-marshall', 'dr-loflin'],
              description: 'ID of the doctor'
            },
            date: { 
              type: 'string',
              description: 'Appointment date (YYYY-MM-DD)'
            },
            time: { 
              type: 'string',
              description: 'Appointment time (HH:MM)'
            },
            treatment: {
              type: 'string',
              description: 'Treatment or procedure type'
            }
          },
          required: ['patientName', 'patientAge', 'patientPhone', 'doctorId', 'date', 'time']
        }
      },
      {
        name: 'cancelAppointment',
        description: 'Cancel an existing appointment',
        parameters: {
          type: 'object',
          properties: {
            appointmentId: { 
              type: 'string',
              description: 'ID of the appointment to cancel'
            }
          },
          required: ['appointmentId']
        }
      },
      {
        name: 'rescheduleAppointment',
        description: 'Reschedule an existing appointment to a new date/time',
        parameters: {
          type: 'object',
          properties: {
            appointmentId: {
              type: 'string',
              description: 'ID of the appointment to reschedule'
            },
            date: {
              type: 'string',
              description: 'New appointment date (YYYY-MM-DD)'
            },
            time: {
              type: 'string',
              description: 'New appointment time (HH:MM)'
            }
          },
          required: ['appointmentId', 'date', 'time']
        }
      },
      {
        name: 'checkAvailability',
        description: 'Check doctor availability for a specific date',
        parameters: {
          type: 'object',
          properties: {
            doctorId: { 
              type: 'string',
              enum: ['dr-marshall', 'dr-loflin'],
              description: 'ID of the doctor'
            },
            date: { 
              type: 'string',
              description: 'Date to check (YYYY-MM-DD)'
            }
          },
          required: ['doctorId', 'date']
        }
      },
      {
        name: 'getAppointmentDetails',
        description: 'Get details of appointments',
        parameters: {
          type: 'object',
          properties: {
            patientPhone: { 
              type: 'string',
              description: 'Patient phone number to search appointments'
            }
          },
          required: []
        }
      }
    ];

    const tools = functions.map(fn => ({ type: 'function' as const, function: fn }));

    // Add context about existing appointments
    const contextMessage = appointments.length > 0 
      ? `\n\nCurrent appointments in system: ${JSON.stringify(appointments)}`
      : '';

    const completion = await openai.chat.completions.create({
      model: process.env.LLM_MODEL!,
      messages: [
        { 
          role: 'system', 
          content: SYSTEM_PROMPT + contextMessage 
        },
        ...messages
      ],
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 500
    });

    const responseMessage = completion.choices[0].message;

    // Handle tool calls (function calls)
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0] as unknown as ToolFunctionCall;
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      if (functionName === 'bookAppointment') {
        // Prevent double booking: check existing appointments for conflicts
        const hasConflict = (appointments || []).some((apt: Appointment) =>
          apt.doctorId === functionArgs.doctorId &&
          apt.date === functionArgs.date &&
          apt.time === functionArgs.time &&
          apt.status !== 'cancelled'
        );
        if (hasConflict) {
          const allSlots = generateTimeSlots(new Date(functionArgs.date));
          const bookedTimes = (appointments || [])
            .filter((apt: Appointment) =>
              apt.doctorId === functionArgs.doctorId &&
              apt.date === functionArgs.date &&
              apt.status !== 'cancelled'
            )
            .map((apt: Appointment) => apt.time);
          const available = allSlots.filter(t => !bookedTimes.includes(t));
          const suggestions = available.slice(0, 6);
          const doctorName = DOCTORS.find(d => d.id === functionArgs.doctorId)?.name || 'the doctor';

          return NextResponse.json({
            content: `Sorry, ${doctorName} already has an appointment on ${functionArgs.date} at ${functionArgs.time}.` +
              (suggestions.length
                ? ` Here are some available times on that date: ${suggestions.join(', ')}. Would you like one of these?`
                : ' Please pick another time or date.'),
            functionCall: null
          });
        }
        // No conflict: let the client proceed to create the appointment
        return NextResponse.json({
          content: responseMessage.content || '',
          functionCall: {
            name: toolCall.function.name,
            arguments: toolCall.function.arguments
          }
        });
      }

      if (functionName === 'checkAvailability') {
        // Generate mock available slots
        const slots = generateTimeSlots(new Date(functionArgs.date));
        const availableSlots = slots.filter(() => Math.random() > 0.3);
        
        return NextResponse.json({
          content: `I've checked the availability for ${
            DOCTORS.find(d => d.id === functionArgs.doctorId)?.name
          } on ${functionArgs.date}. Available time slots are: ${
            availableSlots.join(', ')
          }. Which time would you prefer?`,
          functionCall: null
        });
      } else if (functionName === 'rescheduleAppointment') {
        return NextResponse.json({
          content: `Sure, I can update that appointment for you.`,
          functionCall: {
            name: functionName,
            arguments: JSON.stringify(functionArgs)
          }
        });
      } else if (functionName === 'getAppointmentDetails') {
        // Find matching appointments by phone (if provided) or return all
        const matching = (appointments as Appointment[]).filter((apt) => {
          if (!functionArgs.patientPhone) return true;
          return apt.patientPhone === functionArgs.patientPhone;
        });

        if (matching.length === 0) {
          return NextResponse.json({
            content: `I couldn't find any appointments${
              functionArgs.patientPhone ? ` for ${functionArgs.patientPhone}` : ''
            }.`,
            functionCall: null
          });
        }

        const list = matching
          .map(
            (apt: Appointment) =>
              `• ${apt.patientName} with ${
                DOCTORS.find(d => d.id === apt.doctorId)?.name
              } on ${apt.date} at ${apt.time} (status: ${apt.status})`
          )
          .join('\n');

        return NextResponse.json({
          content: `Here are the appointment details:\n${list}`,
          functionCall: null
        });
      }

      return NextResponse.json({
        content: responseMessage.content || '',
        functionCall: {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments
        }
      });
    }

    return NextResponse.json({
      content: responseMessage.content || '',
      functionCall: null
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}