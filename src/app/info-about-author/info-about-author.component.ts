import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-info-about-author',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatGridListModule],
  templateUrl: './info-about-author.component.html',
  styleUrl: './info-about-author.component.css'
})
export class InfoAboutAuthorComponent {
  private fb = inject(FormBuilder);

  authorName = 'Autor aplikácie';
  shortBio = 'Som mladý vývojár so záujmom o webové technológie a tvorbu užitočných aplikácií. ' +
    'Mám skúsenosti s webovými technológiami a rád riešim komplexné problémy prostredníctvom kódu.' +
    ' V tejto aplikácii som sa zameral na vytvorenie efektívneho nástroja pre autoškoly, ktorý uľahčuje správu a komunikáciu.';
  appGoal = 'Cieľ aplikácie: zjednodušiť riadenie autoškoly, plánovanie jázd a komunikáciu.';
  contactEmail = 'martinkiko18@gmail.com';
  contactPhone = '+421 000 000 000';
  photoUrl: string | null = 'autor.png';

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(30)]],
    surname: ['', [Validators.required, Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email]],
    orgName: ['', [Validators.required, Validators.maxLength(60)]],
    orgAddress: ['', [Validators.required, Validators.maxLength(120)]],
  });

  get f() { return this.form.controls; }

  private buildEmailParts() {
    const { firstName, surname, email, orgName, orgAddress } = this.form.getRawValue();
    const subject = 'Kontakt z aplikácie – Info o autorovi';
    const bodyLines = [
      `Meno: ${firstName}`,
      `Priezvisko: ${surname}`,
      `Email: ${email}`,
      `Názov organizácie: ${orgName}`,
      `Sídlo organizácie: ${orgAddress}`,
      '',
      'Odoslané z položky „Info o autorovi“.',
    ];
    return { subject, body: bodyLines.join('\n') };
  }

  sendViaGmail() {
    if (this.form.invalid) return;
    const to = this.contactEmail;
    const { subject, body } = this.buildEmailParts();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  }
}
