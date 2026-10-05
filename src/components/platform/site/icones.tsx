import {
  BadgeCheck, Bell, Boxes, Briefcase, Building2, Calendar, CalendarClock, Camera, ChartColumn, Clock,
  CreditCard, FileText, Flower2, Gift, Globe, Heart, Image as ImageIcon, LayoutDashboard, LayoutGrid,
  Layers, Mail, MapPin, MessageCircle, MessageSquareHeart, Package, Palette, Percent, Plug, QrCode,
  Receipt, Rocket, Search, ShieldCheck, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Star, Store,
  Tag, Ticket, Truck, Users, Wallet, Zap, Coffee, Banknote, Handshake,
  type LucideIcon,
} from "lucide-react";

/**
 * Os serviços e soluções guardam o ÍCONE pelo nome (texto). Aqui o nome vira componente — lista
 * fechada (e não `icons` inteiro) para não levar todos os ícones do lucide para o navegador.
 * Nome desconhecido cai em "Sparkles": nunca quebra a página.
 */
const MAPA: Record<string, LucideIcon> = {
  BadgeCheck, Bell, Boxes, Briefcase, Building2, Calendar, CalendarClock, Camera, ChartColumn, Clock,
  CreditCard, FileText, Flower2, Gift, Globe, Heart, Image: ImageIcon, ImageIcon, LayoutDashboard, LayoutGrid,
  Layers, Mail, MapPin, MessageCircle, MessageSquareHeart, Package, Palette, Percent, Plug, QrCode,
  Receipt, Rocket, Search, ShieldCheck, ShoppingBag, ShoppingCart, Smartphone, Sparkles, Star, Store,
  Tag, Ticket, Truck, Users, Wallet, Zap, Coffee, Banknote, Handshake,
};

export function Icone({ nome, className }: { nome: string; className?: string }) {
  const C = MAPA[nome] ?? Sparkles;
  return <C className={className} aria-hidden="true" />;
}
