"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import React from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.2, 0.8, 0.2, 1], // "Enterprise" easing
    },
  },
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.li variants={item} className="group hover:shadow-lifted transition-all duration-500 hover:-translate-y-2 cursor-pointer">
      <Card className="h-full">
        <CardContent className="p-8">
          <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors duration-500">
            {icon}
          </div>
          <h3 className="font-serif text-2xl mb-3">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.li>
  );
}
