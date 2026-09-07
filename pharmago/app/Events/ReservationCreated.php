<?php

namespace App\Events;

use App\Models\Reservation;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Queue\SerializesModels;

class ReservationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reservation;

    public function __construct(Reservation $reservation)
    {
        $this->reservation = $reservation->load([
            'user',
            'pharmacie',
            'ordonnance',
            'beneficiaire',
            'medicaments',
        ]);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel(
                'pharmacies.' . $this->reservation->pharmacie_id
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'reservation.created';
    }

    public function broadcastWith(): array
    {
        return [
            'reservation' => $this->reservation->toArray(),
        ];
    }
}
