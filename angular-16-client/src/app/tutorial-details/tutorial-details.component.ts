import { Component, Input } from '@angular/core';
import { TutorialService } from 'src/app/_services/tutorial.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Tutorial } from 'src/app/models/tutorial.model';
import { CinemaService } from 'src/app/_services/cinema.service';
import { Cinema } from '../models/cinema.model';

@Component({
  selector: 'app-tutorial-details',
  templateUrl: './tutorial-details.component.html',
  styleUrls: ['./tutorial-details.component.css'],
})
export class TutorialDetailsComponent {
  @Input() viewMode = false;
  @Input() currentTutorial: Tutorial = {
    title: '',
    description: '',
    MovieTime: 0,
    ShowTime: [{ date: '', hours: '', endTime: '' }],
    published: true,
  };
  selectedCinemas: Cinema[] = [];
  allCinemas: Cinema[] = [];
  message = '';
  cinemas: Cinema[] = [];
  selectedCinemaId: string | undefined; // New property to store selected cinema ID
  hourError = false;
  oldShowTime = false;
  movieTimeError=false;
  titleExists=false;
  constructor(
    private tutorialService: TutorialService,
    private route: ActivatedRoute,
    private router: Router,
    private cinemaService: CinemaService
  ) {}

  cinemaCheckboxChanged(cinema: Cinema): void {
    const isCinemaSelected = this.isCinemaSelected(cinema);

    if (isCinemaSelected) {
      // If cinema is selected, remove it
      const cinemaIndex = this.currentTutorial.cinemas?.findIndex(c => c.id === cinema.id);
      if (cinemaIndex !== undefined && cinemaIndex !== -1) {
        this.currentTutorial.cinemas?.splice(cinemaIndex, 1);
      }
    } else {
      // If cinema is not selected, add it
      this.currentTutorial.cinemas?.push(cinema);
    }
  }

  ngOnInit(): void {
    this.message = '';
    this.getTutorial(this.route.snapshot.params['id']);
    this.loadCinemas();
  }

  loadCinemas(): void {
    this.cinemaService.getAll().subscribe(
      (data) => {
        this.cinemas = data;

        // Assuming currentTutorial has the cinema IDs, map them to the cinema objects
        this.currentTutorial.cinemas = this.currentTutorial.cinemas?.map(cinemaId => {
          return this.cinemas.find(cinema => cinema.id === cinemaId) || { id: cinemaId, name: 'Unknown Cinema' };
        });
      },
      (error) => {
        console.error('Error loading cinemas:', error);
      }
    );
  }

  getTutorial(id: string): void {
    this.tutorialService.get(id).subscribe({
      
      next: (data) => {
        this.currentTutorial = data;
        console.log(data);
      },
      error: (e) => console.error(e),
    });
  }

  updatePublished(status: boolean): void {
    if (status && (!this.currentTutorial.MovieTime || this.hasEmptyShowTime())) {
      console.log('Validation failed:', this.currentTutorial.ShowTime, this.currentTutorial.MovieTime);
      this.message = 'Please provide MovieTime and ensure all ShowTimes have valid Date and Time before publishing.';
      return;
    } else {
      console.log('Validation passed:', this.currentTutorial.ShowTime, this.currentTutorial.MovieTime);
    }

    const data = {
      title: this.currentTutorial.title,
      description: this.currentTutorial.description,
      ShowTime: this.currentTutorial.ShowTime,
      MovieTime: this.currentTutorial.MovieTime,
      published: status,
      cinemas: this.currentTutorial.cinemas?.map((cinema) => cinema.id),
    };

    this.message = '';

    this.tutorialService.update(this.currentTutorial.id, data).subscribe({
      next: (res) => {
        console.log(res);
        this.currentTutorial.published = status;
        this.message = res.message ? res.message : 'The status was updated successfully!';
      },
      error: (e) => console.error(e),
    });
  }

  updateTutorial(): void {
    this.message = '';
    if (
      this.currentTutorial.ShowTime &&
      this.currentTutorial.ShowTime.some(
        (showtime) => {
          const currentTime = new Date();
          const minimumTime = new Date();
          minimumTime.setHours(minimumTime.getHours() + 6);
  
          const showTimeDate = new Date(showtime?.date + ' ' + showtime?.hours);
          return showTimeDate < currentTime || showTimeDate < minimumTime;
        }
      )
    ) {
      console.log('Showtime should be at least 6 hours from the current time.');
      this.hourError = true;
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (
      this.currentTutorial.ShowTime &&
      this.currentTutorial.ShowTime.some((showtime) => showtime?.date && showtime.date < today)
    ) {
      console.log('Showtime date cannot be before today.');
      this.oldShowTime = true;
      return;
    }
    if (this.currentTutorial.MovieTime as number < 0 || this.currentTutorial.MovieTime as number > 240) {
      console.log('Please enter a positive number for MovieTime and ensure it is less than or equal to 240.');
      this.movieTimeError = true;
      return;
    }
  
    // Ensure currentTutorial.cinemas is initialized as an array
    this.currentTutorial.cinemas = this.currentTutorial.cinemas || [];
  
    // Get the IDs of the selected cinemas
    const selectedCinemaIds = this.currentTutorial.cinemas.map((cinema) => cinema.id);
  
    // Merge the existing cinemas with the selected cinemas
    const mergedCinemas = [
      ...this.cinemas.filter((cinema) => selectedCinemaIds.includes(cinema.id)),
      ...this.cinemas.filter((cinema) => !selectedCinemaIds.includes(cinema.id)),
    ];
  
    const data = {
      title: this.currentTutorial.title,
      description: this.currentTutorial.description,
      ShowTime: this.currentTutorial.ShowTime,
      MovieTime: this.currentTutorial.MovieTime,
      published: this.currentTutorial.published,
      cinemas: mergedCinemas.map((cinema) => cinema.id),
    };
  
    this.message = '';
  
    this.tutorialService.update(this.currentTutorial.id, data).subscribe({
      next: (res) => {
        console.log(res);
        this.message = res.message ? res.message : 'This tutorial was updated successfully!';
      },
      error: (e) => console.error(e),
    });
  
    this.hourError = false;
    this.oldShowTime = false;
    this.movieTimeError = false;
    this.titleExists = false;
  }
  
 

  getSelectedCinemaIds(): number[] {
    return this.currentTutorial.cinemas?.map(c => c.id) ?? [];
  }

  deleteTutorial(): void {
    this.tutorialService.delete(this.currentTutorial.id).subscribe({
      next: (res) => {
        console.log(res);
        this.router.navigate(['/tutorials']);
      },
      error: (e) => console.error(e),
    });
  }

  addShowTime() {
    this.currentTutorial.ShowTime = this.currentTutorial.ShowTime ?? [];
    this.currentTutorial.ShowTime.push({ date: '', hours: '', endTime: '' });
  }

  deleteShowTime(): void {
    if (this.currentTutorial.ShowTime && this.currentTutorial.ShowTime.length > 0) {
      this.currentTutorial.ShowTime.pop();
    }
  }

  private hasEmptyShowTime(): boolean {
    return (
      !!this.currentTutorial.ShowTime &&
      this.currentTutorial.ShowTime.some(
        (showTime) =>
          !showTime.date || showTime.date.trim() === '' || !showTime.hours || showTime.hours.trim() === ''
      )
    );
  }

  getShowTimeByDateAndHour(date: String, hour: string): any | undefined {
    if (this.currentTutorial.ShowTime) {
      return this.currentTutorial.ShowTime.find(
        (showTime) => showTime.date === date && showTime.hours == hour
      );
    }
    return undefined;
  }

  isCinemaSelected(cinema: Cinema): boolean {
    return this.currentTutorial.cinemas?.some((c) => c.id === cinema.id) ?? false;
  }
  getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
 
}
