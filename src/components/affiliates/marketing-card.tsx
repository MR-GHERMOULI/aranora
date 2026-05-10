'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Sparkles, Share2, Copy, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Maximize, Smartphone, Square as SquareIcon, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketingAngle {
    id: string;
    title: string;
    text: string;
    badge: string;
}

type ThemeType = 'dark' | 'light';
type SizeType = 'story' | 'square' | 'landscape';

interface SizeConfig {
    id: SizeType;
    name: string;
    icon: any;
    width: string;
    height: string;
    aspectRatio: string;
}

const MARKETING_SIZES: SizeConfig[] = [
    { id: 'story', name: 'Story', icon: Smartphone, width: '360px', height: '640px', aspectRatio: '9/16' },
    { id: 'square', name: 'Square', icon: SquareIcon, width: '400px', height: '400px', aspectRatio: '1/1' },
    { id: 'landscape', name: 'Landscape', icon: Layout, width: '500px', height: '262px', aspectRatio: '1.91/1' },
];

const MARKETING_ANGLES: MarketingAngle[] = [

    {
        id: 'professional',
        title: 'Professional Growth',
        text: 'Transform your freelance workflow with the elite management tools at Aranora. Built for those who demand excellence.',
        badge: 'Top Pick'
    },
    {
        id: 'efficiency',
        title: 'Ultimate Efficiency',
        text: 'Stop drowning in admin work. Aranora streamlines your projects so you can focus on high-value creative work.',
        badge: 'Efficiency'
    },
    {
        id: 'all_in_one',
        title: 'The All-in-One Hub',
        text: 'Everything you need to run a successful freelance business in one premium dashboard. Experience the difference.',
        badge: 'Recommended'
    },
    {
        id: 'exclusive',
        title: 'Exclusive Access',
        text: 'Join the community of elite freelancers using Aranora to scale their business. Use my link for a special trial.',
        badge: 'Limited Time'
    }
];

interface AffiliateMarketingCardProps {
    affiliateCode: string;
    referralLink: string;
    siteName: string;
    logoUrl: string | null;
}

export function AffiliateMarketingCard({ affiliateCode, referralLink, siteName, logoUrl }: AffiliateMarketingCardProps) {

    const cardRef = useRef<HTMLDivElement>(null);
    const [selectedAngle, setSelectedAngle] = React.useState<MarketingAngle>(MARKETING_ANGLES[0]);
    const [customTitle, setCustomTitle] = React.useState(MARKETING_ANGLES[0].title);
    const [customText, setCustomText] = React.useState(MARKETING_ANGLES[0].text);
    const [theme, setTheme] = React.useState<ThemeType>('dark');
    const [size, setSize] = React.useState<SizeType>('story');
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const activeSize = MARKETING_SIZES.find(s => s.id === size) || MARKETING_SIZES[0];

    const handleAngleSelect = (angle: MarketingAngle) => {
        setSelectedAngle(angle);
        setCustomTitle(angle.title);
        setCustomText(angle.text);
    };


    const handleDownload = async () => {
        if (!cardRef.current) return;
        
        setIsDownloading(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2, // Higher quality
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                }
            });
            
            const link = document.createElement('a');
            link.download = `aranora-partner-card-${affiliateCode}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Failed to download card:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left: Controls */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-brand-primary" />
                            Card Customizer
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            Choose a marketing angle that resonates with your audience. We'll generate a high-quality card for you.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select a Template</label>
                        <div className="grid grid-cols-2 gap-3">
                            {MARKETING_ANGLES.map((angle) => (
                                <button
                                    key={angle.id}
                                    onClick={() => handleAngleSelect(angle)}
                                    className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
                                        selectedAngle.id === angle.id
                                            ? 'border-brand-primary bg-brand-primary/[0.03] shadow-sm ring-1 ring-brand-primary'
                                            : 'border-border bg-card hover:border-brand-primary/30'
                                    }`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-xs text-foreground truncate">{angle.title}</span>
                                        <Badge variant="secondary" className="text-[8px] w-fit uppercase h-3.5 px-1 font-bold bg-muted text-muted-foreground">
                                            {angle.badge}
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Customization Fields */}
                    <div className="space-y-4 p-5 bg-muted/20 rounded-2xl border border-border/50">
                        <div className="flex items-center justify-between gap-4 mb-2">
                             <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Theme</label>
                                <div className="flex bg-background border border-border p-1 rounded-lg mt-1">
                                    <button 
                                        onClick={() => setTheme('dark')}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${theme === 'dark' ? 'bg-brand-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <Moon className="h-3 w-3" /> Dark
                                    </button>
                                    <button 
                                        onClick={() => setTheme('light')}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${theme === 'light' ? 'bg-white text-brand-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <Sun className="h-3 w-3" /> Light
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col flex-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Size / Format</label>
                                <div className="flex bg-background border border-border p-1 rounded-lg mt-1 justify-end">
                                    {MARKETING_SIZES.map(s => {
                                        const Icon = s.icon;
                                        return (
                                            <button 
                                                key={s.id}
                                                onClick={() => setSize(s.id)}
                                                className={`p-1.5 rounded-md transition-all ${size === s.id ? 'bg-brand-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
                                                title={s.name}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Custom Title</label>
                            <Input 
                                value={customTitle} 
                                onChange={(e) => setCustomTitle(e.target.value)}
                                className="h-9 bg-background border-border text-sm"
                                placeholder="Enter a catchy title..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Custom Marketing Text</label>
                            <Textarea 
                                value={customText} 
                                onChange={(e) => setCustomText(e.target.value)}
                                className="min-h-[80px] bg-background border-border resize-none text-sm"
                                placeholder="Write your marketing message here..."
                            />
                        </div>
                    </div>



                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <Button 
                            onClick={handleDownload} 
                            disabled={isDownloading}
                            className="flex-1 h-12 rounded-xl font-bold gap-2 shadow-lg shadow-brand-primary/20"
                        >
                            {isDownloading ? 'Generating...' : (
                                <>
                                    <Download className="h-4 w-4" /> Download Card (PNG)
                                </>
                            )}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={copyLink}
                            className="h-12 px-6 rounded-xl font-bold gap-2"
                        >
                            {copied ? <Check className="h-4 w-4 text-brand-secondary" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Link Copied' : 'Copy Link'}
                        </Button>
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="flex flex-col items-center">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Preview: {activeSize.name}</div>
                    
                    {/* The Actual Card to be captured */}
                    <div className="relative group perspective-1000 shadow-2xl rounded-[32px] overflow-hidden">
                        <div 
                            ref={cardRef}
                            className={cn(
                                "overflow-hidden flex flex-col relative transition-all duration-300",
                                theme === 'dark' ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'
                            )}
                            style={{ 
                                width: activeSize.width,
                                height: activeSize.height,
                                background: theme === 'dark' 
                                    ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' 
                                    : 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)',
                                fontFamily: 'Inter, system-ui, sans-serif'
                            }}
                        >
                            {/* Decorative Background Elements */}
                            <div className={cn(
                                "absolute top-[-100px] right-[-100px] w-64 h-64 rounded-full blur-[80px]",
                                theme === 'dark' ? 'bg-brand-primary/20' : 'bg-brand-primary/10'
                            )} />
                            <div className={cn(
                                "absolute bottom-[-50px] left-[-50px] w-64 h-64 rounded-full blur-[80px]",
                                theme === 'dark' ? 'bg-brand-secondary/20' : 'bg-brand-secondary/10'
                            )} />
                            <div className={cn(
                                "absolute inset-0 opacity-[0.03] pointer-events-none",
                                theme === 'dark' ? 'opacity-[0.03]' : 'opacity-[0.08]'
                            )} style={{ backgroundImage: theme === 'dark' ? 'radial-gradient(#fff 1px, transparent 1px)' : 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                            <div className={cn(
                                "p-10 flex flex-col h-full relative z-10",
                                size === 'landscape' ? 'flex-row gap-8 items-center p-8' : 'p-10'
                            )}>
                                {/* Header */}
                                <div className={cn(
                                    "flex justify-between items-start",
                                    size === 'landscape' ? 'flex-col justify-center items-center mb-0 border-r border-border/20 pr-8 h-full w-1/3 shrink-0' : 'mb-12'
                                )}>
                                    <div className={cn("flex flex-col", size === 'landscape' && 'items-center text-center')}>
                                        {logoUrl ? (
                                            <img src={logoUrl} alt={siteName} className={cn("h-10 w-auto object-contain mb-3", size === 'landscape' ? 'self-center' : 'self-start')} />
                                        ) : (
                                            <span className={cn(
                                                "text-3xl font-black tracking-tighter leading-none mb-1",
                                                theme === 'dark' ? 'text-white' : 'text-brand-primary'
                                            )}>
                                                {siteName}
                                            </span>
                                        )}
                                        <span className={cn(
                                            "text-[11px] font-black uppercase tracking-[0.4em]",
                                            theme === 'dark' ? 'text-brand-secondary' : 'text-brand-primary'
                                        )}>
                                            {siteName.toUpperCase()}.COM
                                        </span>

                                    </div>

                                    {size !== 'landscape' && (
                                        <div className={cn(
                                            "rounded-2xl p-2.5 border",
                                            theme === 'dark' ? 'bg-white/10 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm'
                                        )}>
                                            <QRCodeSVG 
                                                value={referralLink} 
                                                size={60} 
                                                bgColor="transparent" 
                                                fgColor={theme === 'dark' ? '#FFFFFF' : '#0F172A'} 
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Main Text Area */}
                                <div className="flex-1 flex flex-col justify-center overflow-hidden">
                                    <Badge className={cn(
                                        "w-fit mb-4 border-none text-[9px] uppercase font-black px-2.5 py-0.5",
                                        theme === 'dark' ? 'bg-brand-primary text-white' : 'bg-brand-primary/10 text-brand-primary'
                                    )}>
                                        {selectedAngle.badge}
                                    </Badge>
                                    <h2 className={cn(
                                        "font-bold leading-[1.1] tracking-tight mb-4 transition-all",
                                        theme === 'dark' ? 'text-white' : 'text-slate-900',
                                        size === 'story' ? 'text-4xl' : size === 'square' ? 'text-3xl' : 'text-2xl'
                                    )}>
                                        {customTitle}
                                    </h2>
                                    <p className={cn(
                                        "leading-relaxed font-medium transition-all",
                                        theme === 'dark' ? 'text-slate-300' : 'text-slate-600',
                                        size === 'story' ? 'text-lg' : size === 'square' ? 'text-base' : 'text-sm line-clamp-4'
                                    )}>
                                        "{customText}"
                                    </p>
                                </div>

                                {/* Footer / Landscape Specific Items */}
                                <div className={cn(
                                    "pt-6 flex items-center justify-between transition-all",
                                    size === 'landscape' ? 'hidden' : 'mt-8 border-t border-border/10',
                                    theme === 'dark' ? 'border-white/10' : 'border-slate-200'
                                )}>
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-[9px] uppercase font-bold tracking-widest mb-1",
                                            theme === 'dark' ? 'text-white/30' : 'text-slate-400'
                                        )}>Visit at</span>
                                        <span className={cn(
                                            "font-mono text-[11px] font-semibold opacity-80 truncate max-w-[180px]",
                                            theme === 'dark' ? 'text-white' : 'text-slate-700'
                                        )}>
                                            {referralLink.replace('https://', '').replace('http://', '').split('?')[0]}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center border",
                                        theme === 'dark' ? 'bg-brand-primary/20 border-brand-primary/30' : 'bg-brand-primary/5 border-brand-primary/10'
                                    )}>
                                        <Share2 className="h-4 w-4 text-brand-primary" />
                                    </div>
                                </div>

                                {size === 'landscape' && (
                                    <div className="absolute right-6 bottom-6 flex flex-col items-end gap-2">
                                        <div className={cn(
                                            "rounded-xl p-2 border",
                                            theme === 'dark' ? 'bg-white/10 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm'
                                        )}>
                                            <QRCodeSVG 
                                                value={referralLink} 
                                                size={40} 
                                                bgColor="transparent" 
                                                fgColor={theme === 'dark' ? '#FFFFFF' : '#0F172A'} 
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>
                                        <span className={cn(
                                            "text-[8px] font-mono opacity-60",
                                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                                        )}>Scan to join</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Brand watermark */}
                            <div className={cn(
                                "absolute bottom-6 rotate-[-90deg] origin-bottom-right opacity-[0.03] select-none",
                                size === 'landscape' ? 'right-4 bottom-4' : 'right-10 bottom-6'
                            )}>
                                <span className={cn(
                                    "text-5xl font-black tracking-tighter uppercase whitespace-nowrap",
                                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                                )}>{siteName}</span>
                            </div>
                        </div>
                    </div>
                    
                    <p className="mt-4 text-[10px] text-muted-foreground italic text-center max-w-[300px]">
                        Optimized for {activeSize.name} format. Preview may be scaled.
                    </p>
                </div>

            </div>
        </div>
    );
}
