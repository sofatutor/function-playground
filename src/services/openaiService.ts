/**
 * OpenAI Service for converting natural language to mathematical expressions
 */

// Define the response type from OpenAI
interface OpenAIResponse {
  expression: string;
  explanation: string;
}

/**
 * Converts natural language description to a mathematical expression using OpenAI
 * @param description The natural language description of the function
 * @returns Promise with the generated expression and explanation
 */
export const convertNaturalLanguageToExpression = async (
  description: string
): Promise<OpenAIResponse> => {
  try {
    // In a real implementation, this would call the OpenAI API
    // For now, we'll simulate the API call with a mock implementation
    
    // This is where you would add your actual OpenAI API call
    // Example:
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-4',
    //     messages: [
    //       {
    //         role: 'system',
    //         content: 'You are a mathematical expression generator. Convert natural language descriptions into JavaScript mathematical expressions.'
    //       },
    //       {
    //         role: 'user',
    //         content: `Convert this description to a JavaScript mathematical expression: ${description}`
    //       }
    //     ]
    //   })
    // });
    // const data = await response.json();
    // return {
    //   expression: data.choices[0].message.content,
    //   explanation: 'Generated using OpenAI'
    // };

    // Mock implementation for demonstration
    console.log('Converting natural language to expression:', description);
    
    // Simple pattern matching for common descriptions
    if (description.toLowerCase().includes('parabola') || description.toLowerCase().includes('quadratic')) {
      return {
        expression: 'x*x',
        explanation: 'A quadratic function (parabola) with the form f(x) = x²'
      };
    } else if (description.toLowerCase().includes('cosine') || description.toLowerCase().includes('cos wave')) {
      return {
        expression: 'Math.cos(x)',
        explanation: 'A cosine wave function with the form f(x) = cos(x)'
      };
    } else if (description.toLowerCase().includes('sine') || description.toLowerCase().includes('sin wave')) {
      return {
        expression: 'Math.sin(x)',
        explanation: 'A sine wave function with the form f(x) = sin(x)'
      };
    } else if (description.toLowerCase().includes('exponential') || description.toLowerCase().includes('growth')) {
      return {
        expression: 'Math.exp(x)',
        explanation: 'An exponential growth function with the form f(x) = e^x'
      };
    } else if (description.toLowerCase().includes('logarithm') || description.toLowerCase().includes('log')) {
      return {
        expression: 'Math.log(x)',
        explanation: 'A natural logarithm function with the form f(x) = ln(x)'
      };
    } else if (description.toLowerCase().includes('cubic')) {
      return {
        expression: 'x*x*x',
        explanation: 'A cubic function with the form f(x) = x³'
      };
    } else if (description.toLowerCase().includes('square root') || description.toLowerCase().includes('sqrt')) {
      return {
        expression: 'Math.sqrt(x)',
        explanation: 'A square root function with the form f(x) = √x'
      };
    } else if (description.toLowerCase().includes('absolute') || description.toLowerCase().includes('abs')) {
      return {
        expression: 'Math.abs(x)',
        explanation: 'An absolute value function with the form f(x) = |x|'
      };
    } else if (description.toLowerCase().includes('tangent') || description.toLowerCase().includes('tan')) {
      return {
        expression: 'Math.tan(x)',
        explanation: 'A tangent function with the form f(x) = tan(x)'
      };
    } else {
      // Default to a simple linear function
      return {
        expression: 'x',
        explanation: 'A linear function with the form f(x) = x'
      };
    }
  } catch (error) {
    console.error('Error converting natural language to expression:', error);
    throw new Error('Failed to convert natural language to expression');
  }
}; 