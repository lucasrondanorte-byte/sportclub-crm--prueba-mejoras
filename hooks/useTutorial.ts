import { useCallback } from 'react';
import Shepherd from 'shepherd.js';
import { User } from '../types';
import { View } from '../components/dashboard/Dashboard';
import { getTutorialSteps } from '../services/tutorialService';

let tour: Shepherd.Tour | null = null;

export const useTutorial = () => {
    const startTutorial = useCallback((view: View, user: User) => {
        // Si ya hay un tour activo, lo cancelamos para empezar uno nuevo.
        if (tour && tour.isActive()) {
            tour.cancel();
        }

        tour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                cancelIcon: {
                    enabled: true
                },
                classes: 'shadow-xl',
                scrollTo: { behavior: 'smooth', block: 'center' },
                buttons: [
                    {
                        action() {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Atrás'
                    },
                    {
                        action() {
                            return this.next();
                        },
                        text: 'Siguiente'
                    }
                ]
            }
        });

        const steps = getTutorialSteps(view, user.role);

        steps.forEach((step, index) => {
            tour!.addStep({
                id: `${view}-${index}`,
                title: step.title,
                text: step.text,
                attachTo: {
                    element: step.element,
                    on: step.position || 'bottom'
                },
                buttons: [
                    ...(index > 0 ? [{
                        action() { return this.back(); },
                        classes: 'shepherd-button-secondary',
                        text: 'Atrás'
                    }] : []),
                    ...(index < steps.length - 1 ? [{
                        action() { return this.next(); },
                        text: 'Siguiente'
                    }] : [{
                        action() { return this.complete(); },
                        text: '¡Entendido!'
                    }])
                ]
            });
        });

        tour.start();

    }, []);

    return { startTutorial };
};