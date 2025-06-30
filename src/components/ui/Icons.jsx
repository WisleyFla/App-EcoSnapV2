// src/components/ui/Icons.jsx
// Biblioteca centralizada de ícones para o EcoSnap

import React from 'react';
import { 
  // Navegação
  Home, 
  User, 
  Users, 
  Book, 
  Sun, 
  Moon,
  
  // Ações
  Plus, 
  X, 
  Search, 
  RefreshCw, 
  Edit, 
  Save, 
  Trash2,
  
  // Interações
  Heart, 
  MessageCircle, 
  Share2, 
  Repeat2, 
  Eye, 
  ThumbsUp,
  
  // Localização e Mapa
  MapPin, 
  Map, 
  Navigation, 
  Compass, 
  Globe,
  
  // Mídia
  Camera, 
  Video, 
  Image, 
  Upload, 
  Download, 
  File,
  
  // Configurações
  Settings, 
  Bell, 
  BellOff, 
  Lock, 
  Unlock, 
  Shield,
  
  // Status e Feedback
  Check, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  HelpCircle, 
  Loader,
  
  // Direções
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  ArrowLeft, 
  ArrowRight,
  
  // Natureza e Meio Ambiente
  Leaf, 
  TreePine, 
  Flower, 
  Bird, 
  Bug, 
  Fish,
  
  // Comunicação
  Mail, 
  Phone, 
  MessageSquare, 
  Send, 
  Inbox,
  
  // Tempo
  Clock, 
  Calendar, 
  Timer, 
  Sunrise, 
  Sunset,
  
  // Ferramentas
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid, 
  List, 
  Menu
} from 'lucide-react';

// Componente wrapper para padronizar props
const Icon = ({ name, size = 20, color, className, style, ...props }) => {
  const IconComponent = ICONS[name];
  
  if (!IconComponent) {
    console.warn(`Ícone "${name}" não encontrado`);
    return <HelpCircle size={size} color={color} className={className} style={style} {...props} />;
  }
  
  return (
    <IconComponent 
      size={size} 
      color={color} 
      className={className} 
      style={style} 
      {...props} 
    />
  );
};

// Mapeamento de nomes para componentes
const ICONS = {
  // === NAVEGAÇÃO ===
  'home': Home,
  'user': User,
  'users': Users,
  'book': Book,
  'sun': Sun,
  'moon': Moon,
  
  // === AÇÕES ===
  'plus': Plus,
  'close': X,
  'search': Search,
  'refresh': RefreshCw,
  'edit': Edit,
  'save': Save,
  'delete': Trash2,
  
  // === INTERAÇÕES ===
  'heart': Heart,
  'comment': MessageCircle,
  'share': Share2,
  'repost': Repeat2,
  'eye': Eye,
  'like': ThumbsUp,
  
  // === LOCALIZAÇÃO ===
  'location': MapPin,
  'map': Map,
  'gps': Navigation,
  'compass': Compass,
  'globe': Globe,
  
  // === MÍDIA ===
  'camera': Camera,
  'video': Video,
  'image': Image,
  'upload': Upload,
  'download': Download,
  'file': File,
  
  // === CONFIGURAÇÕES ===
  'settings': Settings,
  'notification': Bell,
  'notification-off': BellOff,
  'lock': Lock,
  'unlock': Unlock,
  'shield': Shield,
  
  // === STATUS ===
  'check': Check,
  'check-circle': CheckCircle,
  'alert': AlertCircle,
  'info': Info,
  'help': HelpCircle,
  'loading': Loader,
  
  // === DIREÇÕES ===
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  
  // === NATUREZA ===
  'leaf': Leaf,
  'tree': TreePine,
  'flower': Flower,
  'bird': Bird,
  'bug': Bug,
  'fish': Fish,
  
  // === COMUNICAÇÃO ===
  'mail': Mail,
  'phone': Phone,
  'message': MessageSquare,
  'send': Send,
  'inbox': Inbox,
  
  // === TEMPO ===
  'clock': Clock,
  'calendar': Calendar,
  'timer': Timer,
  'sunrise': Sunrise,
  'sunset': Sunset,
  
  // === FERRAMENTAS ===
  'filter': Filter,
  'sort-asc': SortAsc,
  'sort-desc': SortDesc,
  'grid': Grid,
  'list': List,
  'menu': Menu
};

// Componentes específicos para uso direto (mais performático)
export const Icons = {
  // Navegação
  Home: (props) => <Home {...props} />,
  User: (props) => <User {...props} />,
  Users: (props) => <Users {...props} />,
  Book: (props) => <Book {...props} />,
  Sun: (props) => <Sun {...props} />,
  Moon: (props) => <Moon {...props} />,
  
  // Ações principais
  Plus: (props) => <Plus {...props} />,
  Close: (props) => <X {...props} />,
  Search: (props) => <Search {...props} />,
  Refresh: (props) => <RefreshCw {...props} />,
  Check: (props) => <Check {...props} />,
  
  // Interações
  Heart: (props) => <Heart {...props} />,
  Comment: (props) => <MessageCircle {...props} />,
  Share: (props) => <Share2 {...props} />,
  Repost: (props) => <Repeat2 {...props} />,
  
  // Localização
  Location: (props) => <MapPin {...props} />,
  Map: (props) => <Map {...props} />,
  GPS: (props) => <Navigation {...props} />,
  
  // Mídia
  Camera: (props) => <Camera {...props} />,
  Video: (props) => <Video {...props} />,
  Upload: (props) => <Upload {...props} />,
  
  // Natureza
  Leaf: (props) => <Leaf {...props} />,
  Tree: (props) => <TreePine {...props} />,
  Bird: (props) => <Bird {...props} />,
};

// Hook para acessar ícones dinamicamente
export const useIcon = (name, defaultProps = {}) => {
  return (props) => <Icon name={name} {...defaultProps} {...props} />;
};

// Lista de todos os ícones disponíveis (útil para debug/documentação)
export const availableIcons = Object.keys(ICONS).sort();

// Exportar componente principal e mapeamento
export default Icon;
export { ICONS };