import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserItemDialog } from './add-user-item-dialog';

describe('AddUserItemDialog', () => {
  let component: AddUserItemDialog;
  let fixture: ComponentFixture<AddUserItemDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddUserItemDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUserItemDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
