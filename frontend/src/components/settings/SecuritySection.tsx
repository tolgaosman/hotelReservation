"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";

export function SecuritySection() {
  const [mfa, setMfa] = useState(false);

  return (
    <Card title="Güvenlik" subtitle="Şifre ve erişim güvenliği" padded>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField label="Mevcut Şifre">
            <Input type="password" placeholder="••••••••" />
          </FormField>
          <div className="hidden sm:block" />
          <FormField label="Yeni Şifre">
            <Input type="password" placeholder="••••••••" />
          </FormField>
          <FormField label="Yeni Şifre Tekrar">
            <Input type="password" placeholder="••••••••" />
          </FormField>
        </div>
        
        <div className="pt-4 flex justify-start">
           <Button variant="secondary">Şifreyi Güncelle</Button>
        </div>
      </div>
    </Card>
  );
}
