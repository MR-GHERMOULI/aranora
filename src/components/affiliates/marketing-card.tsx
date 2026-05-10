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
import { motion } from 'framer-motion';


interface MarketingAngle {
    id: string;
    title: string;
    text: string;
    badge: string;
}

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
}

export function AffiliateMarketingCard({ affiliateCode, referralLink, siteName }: AffiliateMarketingCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [selectedAngle, setSelectedAngle] = React.useState<MarketingAngle>(MARKETING_ANGLES[0]);
    const [customTitle, setCustomTitle] = React.useState(MARKETING_ANGLES[0].title);
    const [customText, setCustomText] = React.useState(MARKETING_ANGLES[0].text);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

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
                        <div className="grid grid-cols-1 gap-3">
                            {MARKETING_ANGLES.map((angle) => (
                                <button
                                    key={angle.id}
                                    onClick={() => handleAngleSelect(angle)}
                                    className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                                        selectedAngle.id === angle.id
                                            ? 'border-brand-primary bg-brand-primary/[0.03] shadow-md ring-1 ring-brand-primary'
                                            : 'border-border bg-card hover:border-brand-primary/30'
                                    }`}
                                >
                                    {selectedAngle.id === angle.id && (
                                        <div className="absolute top-0 right-0 p-1">
                                            <Check className="h-4 w-4 text-brand-primary" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm text-foreground">{angle.title}</span>
                                        <Badge variant="secondary" className="text-[9px] uppercase h-4 px-1.5 font-bold bg-muted text-muted-foreground group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                                            {angle.badge}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{angle.text}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Customization Fields */}
                    <div className="space-y-4 p-6 bg-muted/20 rounded-2xl border border-border/50">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Custom Title</label>
                            <Input 
                                value={customTitle} 
                                onChange={(e) => setCustomTitle(e.target.value)}
                                className="h-10 bg-background border-border"
                                placeholder="Enter a catchy title..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Custom Marketing Text</label>
                            <Textarea 
                                value={customText} 
                                onChange={(e) => setCustomText(e.target.value)}
                                className="min-h-[100px] bg-background border-border resize-none"
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
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Live Preview</div>
                    
                    {/* The Actual Card to be captured */}
                    <div className="relative group perspective-1000">
                        <div 
                            ref={cardRef}
                            className="w-[400px] h-[560px] bg-[#0F172A] rounded-[32px] overflow-hidden flex flex-col relative shadow-2xl"
                            style={{ 
                                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                fontFamily: 'Inter, system-ui, sans-serif'
                            }}
                        >
                            {/* Decorative Background Elements */}
                            <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-brand-primary/20 rounded-full blur-[80px]" />
                            <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-brand-secondary/20 rounded-full blur-[80px]" />
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                            <div className="p-10 flex flex-col h-full relative z-10">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-12">
                                    <div className="flex flex-col">
                                        <span className="text-white text-3xl font-black tracking-tighter leading-none mb-1">
                                            {siteName}
                                        </span>
                                        <span className="text-brand-secondary text-[10px] font-bold uppercase tracking-[0.3em]">Partner Program</span>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                                        <QRCodeSVG 
                                            value={referralLink} 
                                            size={70} 
                                            bgColor="transparent" 
                                            fgColor="#FFFFFF" 
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                </div>

                                {/* Main Text Area */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <Badge className="w-fit mb-4 bg-brand-primary text-white border-none text-[10px] uppercase font-black px-3 py-1">
                                        {selectedAngle.badge}
                                    </Badge>
                                    <h2 className="text-white text-4xl font-bold leading-[1.1] tracking-tight mb-6">
                                        {customTitle}
                                    </h2>
                                    <p className="text-slate-300 text-lg leading-relaxed font-medium">
                                        "{customText}"
                                    </p>
                                </div>


                                {/* Footer / Social Identity */}
                                <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Visit directly at</span>
                                        <span className="text-white font-mono text-sm font-semibold opacity-80 truncate max-w-[200px]">
                                            {referralLink.replace('https://', '').replace('http://', '')}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
                                        <Share2 className="h-4 w-4 text-brand-primary" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Brand watermark */}
                            <div className="absolute bottom-6 right-10 rotate-[-90deg] origin-bottom-right opacity-10">
                                <span className="text-white text-5xl font-black tracking-tighter uppercase whitespace-nowrap">ARANORA</span>
                            </div>
                        </div>
                    </div>
                    
                    <p className="mt-6 text-xs text-muted-foreground italic text-center max-w-[300px]">
                        The card is optimized for Instagram Stories, LinkedIn posts, and X threads. 
                    </p>
                </div>
            </div>
        </div>
    );
}
