import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBookingComponent } from './add-booking.component';

describe('AddCinemaComponent', () => {
  let component: AddBookingComponent;
  let fixture: ComponentFixture<AddBookingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddBookingComponent]
    });
    fixture = TestBed.createComponent(AddBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
