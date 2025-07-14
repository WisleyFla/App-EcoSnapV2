// supabase/functions/telegram-handler/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cabeçalhos CORS para permitir a comunicação com seu app React
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Pega as variáveis de ambiente de forma segura das "Secrets" do Supabase
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')
const API_BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

serve(async (req) => {
  // Lida com a requisição "preflight" OPTIONS do navegador para o CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializa o cliente do Supabase com a chave de serviço para ter permissões de escrita
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const formData = await req.formData();
    const action = formData.get('action') as string;
    
    if (!action) {
      throw new Error("Ação ('action') não foi fornecida no FormData.");
    }

    // --- ROTA PARA DELETAR MENSAGEM ---
    if (action === 'delete') {
      const messageId = formData.get('message_id') as string;
      if (!messageId) throw new Error('message_id é obrigatório para deletar.');

      const deleteResponse = await fetch(`${API_BASE_URL}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, message_id: messageId }),
      });
      
      const deleteData = await deleteResponse.json();
      if (!deleteData.ok) {
          console.warn(`Aviso ao deletar mensagem do Telegram: ${deleteData.description}`);
      }

      return new Response(JSON.stringify({ success: true, message: 'Comando de exclusão enviado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- ROTA PARA FAZER UPLOAD DE MÍDIA ---
    if (action === 'upload') {
      const file = formData.get('file') as File;
      const caption = formData.get('caption') as string || '';
      const postId = formData.get('post_id') as string;
      const isVideo = formData.get('is_video') === 'true';

      // Validações robustas
      if (!file || !(file instanceof File)) throw new Error('Campo "file" não encontrado ou inválido no FormData.');
      if (!postId) throw new Error('Campo "post_id" não encontrado no FormData.');

      const actualIsVideo = file.type.startsWith('video/');
      if (isVideo !== actualIsVideo) {
        throw new Error(`Discrepância no tipo de mídia: cliente enviou ${isVideo ? 'vídeo' : 'imagem'}, mas o arquivo é do tipo ${file.type}`);
      }

      const endpoint = isVideo ? 'sendVideo' : 'sendPhoto';
      const mediaField = isVideo ? 'video' : 'photo';

      const telegramFormData = new FormData();
      telegramFormData.append('chat_id', CHAT_ID);
      telegramFormData.append('caption', caption.slice(0, 1024)); // Limita a legenda
      telegramFormData.append(mediaField, file, file.name);

      const telegramResponse = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        body: telegramFormData,
      });

      const result = await telegramResponse.json();
      if (!result.ok) throw new Error(`Erro da API do Telegram: ${result.description}`);

      const sentMessage = Array.isArray(result.result) ? result.result[0] : result.result;
      const message_id = sentMessage.message_id;
      const file_id = isVideo 
        ? sentMessage.video.file_id 
        : sentMessage.photo[sentMessage.photo.length - 1].file_id;

      const fileInfoRes = await fetch(`${API_BASE_URL}/getFile?file_id=${file_id}`);
      const fileInfoData = await fileInfoRes.json();
      if (!fileInfoData.ok) throw new Error('Não foi possível obter os detalhes do arquivo do Telegram.');
      
      const download_url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfoData.result.file_path}`;

      await supabaseAdmin.from('telegram_messages').insert({
        post_id: postId,
        telegram_chat_id: CHAT_ID,
        telegram_message_id: message_id,
      });
      
      return new Response(JSON.stringify({ success: true, download_url, message_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Ação inválida fornecida.');

  } catch (error) {
    console.error('ERRO NA EDGE FUNCTION:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});