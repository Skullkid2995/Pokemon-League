# Image Analysis Setup Guide

This feature uses OpenAI's Vision API to automatically extract game information (winner and damage points) from Pokemon TCG Pocket screenshots.

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section: https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the API key (you won't be able to see it again!)

### 2. Add API Key to Environment Variables

Add the OpenAI API key to your `.env.local` file:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Deploy to Vercel (if using Vercel)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add a new variable:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key
   - **Environment:** Production, Preview, Development (select all)
4. Redeploy your application

## How It Works

1. **User uploads screenshot** → Image is sent to the analysis API
2. **OpenAI Vision API analyzes** → Extracts:
   - Winner (player1 or player2)
   - Damage points for both players
   - Confidence level (high/medium/low)
3. **Form auto-populates** → Damage points and winner selection are automatically filled
4. **User verifies** → User can review and adjust if needed before saving

## Cost Considerations

- OpenAI Vision API pricing: ~$0.01-0.03 per image (depending on image size)
- Each screenshot upload triggers one API call
- Consider adding rate limiting for production use

## Fallback Behavior

If image analysis fails or returns low confidence:
- User sees an error message
- Form fields remain editable
- User can manually enter the information
- Game can still be saved normally

## Testing

1. Upload a clear screenshot of a completed game
2. Wait for the analysis (usually 2-5 seconds)
3. Check if damage points and winner are auto-filled
4. Verify the data is correct
5. Save the game

## Troubleshooting

**Error: "OpenAI API key not configured"**
- Make sure `OPENAI_API_KEY` is set in your `.env.local` file
- Restart your development server after adding the key

**Error: "Failed to analyze image"**
- Check your OpenAI API key is valid
- Ensure you have credits in your OpenAI account
- Check the image is clear and readable

**Low confidence results**
- The AI will still try to extract data but may need manual verification
- Ensure screenshots are clear and show the game result screen

