import React from 'react';
import { Card } from '../components/ui/Card';

export const About: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">About HackVerse</h1>
      <Card>
        <p className="text-gray-300 leading-relaxed">
          HackVerse is a demo platform showcasing organizer, participant, and judge workflows for hackathons. You can create events, assign judges, register, manage teams, submit projects, and score entries.
        </p>
      </Card>
    </div>
  );
};

export default About;



