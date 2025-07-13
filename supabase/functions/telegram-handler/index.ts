// supabase/functions/telegram-handler/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')
const API_BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- INÍCIO DO BLOCO DE DEBUG ---
    console.log('--- Nova requisição recebida na Edge Function ---');
    const formData = await req.formData();
    console.log('FormData recebido. Verificando campos:');
    
    // Log de todos os campos recebidos para ver o que chegou
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`Campo: ${key}, Nome do Arquivo: ${value.name}, Tipo: ${value.type}`);
      } else {
        console.log(`Campo: ${key}, Valor: ${value}`);
      }
    }
    // --- FIM DO BLOCO DE DEBUG ---

    const action = formData.get('action') as string
    if (!action) throw new Error("Ação ('action') não foi fornecida no FormData.");
    
    console.log(`Ação detectada: ${action}`);

    // (O resto da sua função continua igual...)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    if (action === 'delete') { /* ... lógica de delete ... */ }

    if (action === 'upload') {
      const file = formData.get('file') as File
      const caption = formData.get('caption') as string || ''
      const postId = formData.get('post_id') as string

      if (!file) throw new Error('Campo "file" não encontrado no FormData.')
      if (!postId) throw new Error('Campo "post_id" não encontrado no FormData.')
      
      const isVideo = file.type.startsWith('video/')
      const endpoint = isVideo ? 'sendVideo' : 'sendPhoto'
      const mediaField = isVideo ? 'video' : 'photo'

      const telegramFormData = new FormData()
      telegramFormData.append('chat_id', CHAT_ID)
      // Garante que a legenda seja uma string, mesmo que vazia, e a limita para o Telegram
      const safeCaption = (caption || '').slice(0, 1024); 
      telegramFormData.append('caption', safeCaption)
      telegramFormData.append(mediaField, file, file.name)
      
      const telegramResponse = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        body: telegramFormData,
      })

      const result = await telegramResponse.json()
      if (!result.ok) throw new Error(result.description)

      const message_id = result.result.message_id
      const file_id = isVideo ? result.result.video.file_id : result.result.photo[result.result.photo.length - 1].file_id;

      const fileInfoRes = await fetch(`${API_BASE_URL}/getFile?file_id=${file_id}`)
      const fileInfoData = await fileInfoRes.json()
      const download_url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfoData.result.file_path}`

      await supabaseAdmin.from('telegram_messages').insert({
        post_id: postId,
        telegram_chat_id: CHAT_ID,
        telegram_message_id: message_id,
      })
      
      return new Response(JSON.stringify({ success: true, download_url, message_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Ação inválida.')

  } catch (error) {
    console.error('ERRO NA EDGE FUNCTION:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})