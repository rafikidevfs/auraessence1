export type AdminOrder = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  items: { productId: string; name: string; qty: number; price: number }[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: string;
  city?: string;
  cep?: string;
  paymentMethod?: string;
  shipping?: number;
  notes?: string;
  paymentStatus?: string;
};

export function getDateKey(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function filterOrdersByDate(orders: AdminOrder[], selectedDate?: string) {
  if (!selectedDate) return orders;
  return orders.filter((order) => getDateKey(order.createdAt) === selectedDate);
}

// --- FUNÇÕES AUXILIARES PARA O PADRÃO OFICIAL DO PIX ---

// Formata os blocos do Pix seguindo a regra: ID do campo + Tamanho do valor + Valor
const formatEMV = (id: string, value: string): string => {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
};

// Faz o cálculo do checksum (CRC-CCITT de 16 bits), exigido por todos os bancos brasileiros
function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    let x = ((crc >> 8) ^ charCode) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// --- FUNÇÃO CORRIGIDA ---

export function buildPixPayload({ orderId, amount }: { orderId: string; amount: number; customerName: string }) {
  // 1. DADOS DE RECEBIMENTO (Configure aqui os seus dados reais)
  const PIX_KEY = "chrizinho31@gmail.com"; // <-- Substitua pela sua chave
  const MERCHANT_NAME = "AURAESSENCE";  // <-- Nome do beneficiário (sem acentos, máx 25 caracteres)
  const MERCHANT_CITY = "SALVADOR";     // <-- Cidade da conta (sem acentos, máx 15 caracteres)

  // 2. MONTAGEM DA ESTRUTURA PADRÃO EMV DO BANCO CENTRAL
  let payload = "000201"; // Versão do payload
  payload += "010212";   // Indica QR Code estático (pode ser pago várias vezes)

  // Informações da conta destinatária (Campo 26)
  const accountInfo = "0014br.gov.bcb.pix" + formatEMV("01", PIX_KEY);
  payload += formatEMV("26", accountInfo);

  payload += "52040000"; // Categoria do comerciante
  payload += "5303986";  // Código da moeda (986 = BRL)
  payload += formatEMV("54", amount.toFixed(2)); // Valor do pedido formatado
  payload += "5802BR";   // Código do país
  payload += formatEMV("59", MERCHANT_NAME);
  payload += formatEMV("60", MERCHANT_CITY);

  // Campo 62: Identificador da transação (TXID)
  // O ID do Pix deve ser limpo e ter no máximo 25 caracteres (gerenciado no seu CheckoutPage)
  const cleanTxId = orderId ? orderId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 25) : "***";
  payload += formatEMV("62", formatEMV("05", cleanTxId));

  // Adiciona o cabeçalho do CRC e calcula a assinatura matemática obrigatória
  payload += "6304"; 
  payload += calculateCRC16(payload);

  return payload;
}