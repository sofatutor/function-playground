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
 * @param apiKey Optional API key to use for the request
 * @returns Promise with the generated expression and explanation
 */
export const convertNaturalLanguageToExpression = async (
  description: string,
  apiKey?: string | null
): Promise<OpenAIResponse> => {
  try {
    // If an API key is provided, use the OpenAI API
    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a mathematical expression generator. Convert natural language descriptions into JavaScript mathematical expressions.
                Follow these rules:
                1. Return only valid JavaScript expressions that can be evaluated
                2. Use 'x' as the variable
                3. Use Math.sin, Math.cos, Math.tan, Math.sqrt, Math.abs, Math.log, Math.exp, etc. for mathematical functions
                4. Format your response as a JSON object with two properties: "expression" (the JavaScript expression) and "explanation" (a brief explanation of the function)
                5. Do not include any other text in your response, only the JSON object`
              },
              {
                role: 'user',
                content: `Convert this description to a JavaScript mathematical expression: ${description}`
              }
            ]
          })
        });
        
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
          // Try to parse the response as JSON
          const parsedContent = JSON.parse(content);
          return {
            expression: parsedContent.expression,
            explanation: parsedContent.explanation
          };
        } catch (_parseError) {
          // If parsing fails, try to extract the expression using regex
          const expressionMatch = content.match(/expression["\s:]+([^"]+)/i);
          const explanationMatch = content.match(/explanation["\s:]+([^"]+)/i);
          
          return {
            expression: expressionMatch ? expressionMatch[1].replace(/[",}]/g, '').trim() : 'x',
            explanation: explanationMatch ? explanationMatch[1].replace(/[",}]/g, '').trim() : 'Generated using OpenAI'
          };
        }
      } catch (apiError) {
        console.error('Error calling OpenAI API:', apiError);
        // Fall back to the mock implementation
        return getMockResponse(description);
      }
    }
    
    // If no API key is provided, use the mock implementation
    return getMockResponse(description);
  } catch (error) {
    console.error('Error converting natural language to expression:', error);
    throw new Error('Failed to convert natural language to expression');
  }
};

/**
 * Get a mock response for the given description
 * @param description The natural language description
 * @returns A mock OpenAI response
 */
const getMockResponse = (description: string): OpenAIResponse => {
  console.log('Using mock implementation for:', description);
  
  // Simple pattern matching for common descriptions
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('parabola') || lowerDesc.includes('quadratic')) {
    return {
      expression: 'x*x',
      explanation: 'A quadratic function (parabola) with the form f(x) = x²'
    };
  } else if (lowerDesc.includes('cosine') || (lowerDesc.includes('cos') && !lowerDesc.includes('sin'))) {
    return {
      expression: 'Math.cos(x)',
      explanation: 'A cosine wave function with the form f(x) = cos(x)'
    };
  } else if (lowerDesc.includes('sine') || (lowerDesc.includes('sin') && !lowerDesc.includes('cos'))) {
    return {
      expression: 'Math.sin(x)',
      explanation: 'A sine wave function with the form f(x) = sin(x)'
    };
  } else if (lowerDesc.includes('exponential') || lowerDesc.includes('growth')) {
    return {
      expression: 'Math.exp(x)',
      explanation: 'An exponential growth function with the form f(x) = e^x'
    };
  } else if (lowerDesc.includes('logarithm') || lowerDesc.includes('log')) {
    return {
      expression: 'Math.log(x)',
      explanation: 'A natural logarithm function with the form f(x) = ln(x)'
    };
  } else if (lowerDesc.includes('cubic')) {
    return {
      expression: 'x*x*x',
      explanation: 'A cubic function with the form f(x) = x³'
    };
  } else if (lowerDesc.includes('square root') || lowerDesc.includes('sqrt')) {
    return {
      expression: 'Math.sqrt(x)',
      explanation: 'A square root function with the form f(x) = √x'
    };
  } else if (lowerDesc.includes('absolute') || lowerDesc.includes('abs')) {
    return {
      expression: 'Math.abs(x)',
      explanation: 'An absolute value function with the form f(x) = |x|'
    };
  } else if (lowerDesc.includes('tangent') || lowerDesc.includes('tan')) {
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
}; 